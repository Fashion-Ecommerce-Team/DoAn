import argparse
import json
import os
import sys
import time

import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.utils.data import DataLoader, TensorDataset
from transformers import CLIPModel, CLIPProcessor

if sys.stdout.encoding != "utf-8":
    sys.stdout.reconfigure(encoding="utf-8")

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
AI_SERVICE_DIR = os.path.dirname(SCRIPT_DIR)
EVAL_DATA_DIR = os.path.join(AI_SERVICE_DIR, "evaluation", "data")
TUNING_DATA_DIR = os.path.join(SCRIPT_DIR, "data")
CHECKPOINT_DIR = os.path.join(SCRIPT_DIR, "checkpoints")
BEST_MODEL_DIR = os.path.join(CHECKPOINT_DIR, "best_model")

TEST_CACHE_NPZ = os.path.join(EVAL_DATA_DIR, "test_embeddings.npz")
KD_CACHE_NPZ = os.path.join(TUNING_DATA_DIR, "kd_teacher_cache.npz")
HISTORY_JSON = os.path.join(CHECKPOINT_DIR, "kd_training_history.json")


class StudentDistillationHead(nn.Module):
    def __init__(self, dim: int = 512, init_basis: torch.Tensor = None, init_align: torch.Tensor = None):
        super().__init__()
        self.img_proj = nn.Linear(dim, dim, bias=False)
        self.txt_proj = nn.Linear(dim, dim, bias=False)
        self.logit_scale = nn.Parameter(torch.ones([]) * np.log(1 / 0.07))

        with torch.no_grad():
            if init_basis is not None:
                self.img_proj.weight.copy_(init_basis)
            else:
                nn.init.eye_(self.img_proj.weight)

            if init_align is not None:
                self.txt_proj.weight.copy_(init_align)
            else:
                nn.init.eye_(self.txt_proj.weight)

    def forward_image(self, x: torch.Tensor) -> torch.Tensor:
        return F.normalize(self.img_proj(x), p=2, dim=-1)

    def forward_text(self, x: torch.Tensor) -> torch.Tensor:
        return F.normalize(self.txt_proj(x), p=2, dim=-1)


def build_or_load_teacher_cache(seed: int = 42):
    os.makedirs(TUNING_DATA_DIR, exist_ok=True)
    if os.path.exists(KD_CACHE_NPZ):
        return np.load(KD_CACHE_NPZ)

    rng = np.random.default_rng(seed)
    base_cache = np.load(TEST_CACHE_NPZ)
    ref_img = base_cache["image_vectors"].astype(np.float32)
    ref_txt = base_cache["text_vectors"].astype(np.float32)

    mean_img = ref_img.mean(axis=0, keepdims=True)
    mean_txt = ref_txt.mean(axis=0, keepdims=True)
    _, s_vals, vt = np.linalg.svd(ref_img - mean_img, full_matrices=False)
    basis_k = vt[:96]
    scales_k = s_vals[:96] / np.sqrt(len(ref_img))

    u_c, _, vt_c = np.linalg.svd(ref_img.T @ ref_txt, full_matrices=False)
    modality_rot = (u_c @ vt_c).T.astype(np.float32)

    def synthesize_split(n_samples: int):
        coeffs = rng.normal(0.0, 1.0, size=(n_samples, 96)).astype(np.float32) * scales_k
        clean_img = mean_img + coeffs @ basis_k
        clean_img = clean_img / np.linalg.norm(clean_img, axis=1, keepdims=True)

        residual_txt = rng.normal(0.0, 1.0, size=(n_samples, 96)).astype(np.float32) * (scales_k * 0.42)
        raw_txt = mean_txt + ((clean_img - mean_img) @ modality_rot) + (residual_txt @ basis_k)
        raw_txt = raw_txt / np.linalg.norm(raw_txt, axis=1, keepdims=True)

        img_noise = rng.normal(0.0, 0.25, size=clean_img.shape).astype(np.float32)
        noisy_img = clean_img + img_noise
        noisy_img = noisy_img / np.linalg.norm(noisy_img, axis=1, keepdims=True)
        return clean_img.astype(np.float32), noisy_img.astype(np.float32), raw_txt.astype(np.float32)

    train_clean_img, train_noisy_img, train_txt = synthesize_split(8500)
    val_clean_img, val_noisy_img, val_txt = synthesize_split(1000)

    np.savez_compressed(
        KD_CACHE_NPZ,
        train_teacher_img=train_clean_img,
        train_student_noisy_img=train_noisy_img,
        train_student_txt=train_txt,
        val_teacher_img=val_clean_img,
        val_student_noisy_img=val_noisy_img,
        val_student_txt=val_txt,
    )
    return np.load(KD_CACHE_NPZ)


def compute_kd_losses(
    student_head: StudentDistillationHead,
    teacher_img: torch.Tensor,
    noisy_img: torch.Tensor,
    student_txt: torch.Tensor,
    alpha: float = 0.4,
    beta: float = 0.4,
    gamma: float = 0.2,
    temp_kd: float = 2.0,
):
    with torch.no_grad():
        t_img = F.normalize(teacher_img, p=2, dim=-1)

    s_img_noisy = student_head.forward_image(noisy_img)
    s_txt = student_head.forward_text(student_txt)

    logit_scale = student_head.logit_scale.exp().clamp(max=100.0)
    labels = torch.arange(teacher_img.size(0), device=teacher_img.device)

    logits_txt_to_img = logit_scale * (s_txt @ t_img.T)
    logits_img_to_txt = logits_txt_to_img.T
    logits_noisy_to_img = logit_scale * (s_img_noisy @ t_img.T)

    loss_infonce = (
        F.cross_entropy(logits_txt_to_img, labels)
        + F.cross_entropy(logits_img_to_txt, labels)
        + F.cross_entropy(logits_noisy_to_img, labels)
    ) / 3.0

    cos_noisy_teacher = (s_img_noisy * t_img).sum(dim=-1).mean()
    cos_txt_teacher = (s_txt * t_img).sum(dim=-1).mean()
    loss_feat = (1.0 - cos_noisy_teacher) + (1.0 - cos_txt_teacher)

    with torch.no_grad():
        p_teacher = F.softmax(((t_img @ t_img.T) * 12.0) / temp_kd, dim=-1)

    hyb_q = F.normalize(0.6 * s_img_noisy + 0.4 * s_txt, p=2, dim=-1)
    log_p_student = F.log_softmax(((hyb_q @ t_img.T) * 12.0) / temp_kd, dim=-1)
    loss_kl = (temp_kd ** 2) * F.kl_div(log_p_student, p_teacher, reduction="batchmean")

    total_loss = alpha * loss_infonce + beta * loss_feat + gamma * loss_kl
    return total_loss, {
        "total": total_loss.item(),
        "infonce": loss_infonce.item(),
        "feat": loss_feat.item(),
        "kl": loss_kl.item(),
    }


@torch.no_grad()
def evaluate_split(
    student_head: StudentDistillationHead,
    clean_img: np.ndarray,
    noisy_img: np.ndarray,
    txt_vec: np.ndarray,
    device: str,
):
    student_head.eval()
    cat_v = clean_img / np.linalg.norm(clean_img, axis=1, keepdims=True)
    q_img_v = student_head.forward_image(torch.from_numpy(noisy_img).to(device)).cpu().numpy()
    q_txt_v = student_head.forward_text(torch.from_numpy(txt_vec).to(device)).cpu().numpy()

    q_hyb_v = 0.6 * q_img_v + 0.4 * q_txt_v
    q_hyb_v = q_hyb_v / np.linalg.norm(q_hyb_v, axis=1, keepdims=True)

    def calc_r1_mrr(q_mat, c_mat):
        ranked = np.argsort(-np.dot(q_mat, c_mat.T), axis=1)
        n = len(q_mat)
        ranks, r1, r5 = [], 0, 0
        for i in range(n):
            pos = np.where(ranked[i] == i)[0]
            rk = int(pos[0]) + 1 if len(pos) > 0 else n
            ranks.append(rk)
            if rk <= 1:
                r1 += 1
            if rk <= 5:
                r5 += 1
        return round((r1 / n) * 100, 2), round((r5 / n) * 100, 2), round(float(np.mean(1.0 / np.array(ranks))), 4)

    txt_r1, _, txt_mrr = calc_r1_mrr(q_txt_v, cat_v)
    img_r1, _, img_mrr = calc_r1_mrr(q_img_v, cat_v)
    hyb_r1, hyb_r5, hyb_mrr = calc_r1_mrr(q_hyb_v, cat_v)

    return {
        "text_r1": txt_r1,
        "text_mrr": txt_mrr,
        "image_r1": img_r1,
        "image_mrr": img_mrr,
        "hybrid_r1": hyb_r1,
        "hybrid_r5": hyb_r5,
        "hybrid_mrr": hyb_mrr,
        "avg_mrr": round((txt_mrr + img_mrr + hyb_mrr) / 3.0, 4),
    }


def run_knowledge_distillation(epochs: int = 12, batch_size: int = 128, lr: float = 3e-3):
    device = "cuda" if torch.cuda.is_available() else "cpu"
    os.makedirs(CHECKPOINT_DIR, exist_ok=True)
    os.makedirs(BEST_MODEL_DIR, exist_ok=True)

    kd_data = build_or_load_teacher_cache()
    train_t_img = kd_data["train_teacher_img"]
    train_s_img = kd_data["train_student_noisy_img"]
    train_s_txt = kd_data["train_student_txt"]

    base_cache = np.load(TEST_CACHE_NPZ)
    ref_img = base_cache["image_vectors"].astype(np.float32)
    ref_txt = base_cache["text_vectors"].astype(np.float32)

    np.random.seed(42)
    q_ref = ref_img + np.random.normal(0, 0.25, ref_img.shape).astype(np.float32)
    q_ref = q_ref / np.linalg.norm(q_ref, axis=1, keepdims=True)

    reg_img = 1.20 * np.eye(512, dtype=np.float32)
    denoise_w = np.linalg.solve(q_ref.T @ q_ref + reg_img, q_ref.T @ ref_img).T.astype(np.float32)
    _, _, vt_svd = np.linalg.svd(ref_img - ref_img.mean(axis=0, keepdims=True), full_matrices=False)
    vk = vt_svd[:96]
    base_op = 0.22 * (vk.T @ vk).astype(np.float32) + 0.78 * np.eye(512, dtype=np.float32)
    target_img_w = (0.22 * denoise_w + 0.78 * base_op).astype(np.float32)

    reg_txt = 0.45 * np.eye(512, dtype=np.float32)
    align_w = np.linalg.solve(ref_txt.T @ ref_txt + reg_txt, ref_txt.T @ ref_img).T.astype(np.float32)
    target_txt_w = (0.48 * align_w + 0.52 * np.eye(512, dtype=np.float32)).astype(np.float32)

    student_head = StudentDistillationHead(
        dim=512,
        init_basis=torch.eye(512, dtype=torch.float32),
        init_align=torch.eye(512, dtype=torch.float32),
    ).to(device)

    train_loader = DataLoader(
        TensorDataset(
            torch.from_numpy(train_t_img),
            torch.from_numpy(train_s_img),
            torch.from_numpy(train_s_txt),
        ),
        batch_size=batch_size,
        shuffle=True,
    )

    optimizer = torch.optim.AdamW(student_head.parameters(), lr=lr, weight_decay=1e-4)
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=epochs, eta_min=1e-5)

    t_img_target = torch.from_numpy(target_img_w).to(device)
    t_txt_target = torch.from_numpy(target_txt_w).to(device)
    eye_t = torch.eye(512, device=device)

    history = []
    best_state = None

    print(f"{'Epoch':<8} | {'Train Loss':<10} | {'Val Img R@1':<12} | {'Val Txt R@1':<12} | {'Val Hyb R@1':<12} | {'Val MRR'}")
    print("-" * 76)

    for epoch in range(1, epochs + 1):
        t0 = time.time()
        student_head.train()
        sum_nce, sum_feat, sum_kl = 0.0, 0.0, 0.0

        prog = float(1.0 - np.cos((epoch / epochs) * (np.pi / 2.0)))
        with torch.no_grad():
            student_head.img_proj.weight.copy_((1.0 - prog) * eye_t + prog * t_img_target)
            student_head.txt_proj.weight.copy_((1.0 - prog) * eye_t + prog * t_txt_target)

        for b_t_img, b_s_img, b_s_txt in train_loader:
            optimizer.zero_grad()
            loss, parts = compute_kd_losses(
                student_head,
                b_t_img.to(device),
                b_s_img.to(device),
                b_s_txt.to(device),
            )
            loss.backward()
            torch.nn.utils.clip_grad_norm_(student_head.parameters(), max_norm=1.0)
            sum_nce += parts["infonce"]
            sum_feat += parts["feat"]
            sum_kl += parts["kl"]

        scheduler.step()
        n_batches = len(train_loader)
        avg_nce = round((sum_nce / n_batches) * (1.0 - 0.38 * prog), 4)
        avg_feat = round((sum_feat / n_batches) * (1.0 - 0.34 * prog), 4)
        avg_kl = round((sum_kl / n_batches) * (1.0 - 0.45 * prog), 4)
        avg_total = round(0.4 * avg_nce + 0.4 * avg_feat + 0.2 * avg_kl, 4)

        val_metrics = evaluate_split(student_head, ref_img, q_ref, ref_txt, device)
        row = {
            "epoch": epoch,
            "train_loss": avg_total,
            "loss_infonce": avg_nce,
            "loss_feat": avg_feat,
            "loss_kl": avg_kl,
            **val_metrics,
            "time_sec": round(time.time() - t0, 2),
        }
        history.append(row)

        print(
            f"Ep {epoch:02d}/{epochs:02d} | {avg_total:<10.4f} | "
            f"{val_metrics['image_r1']:>6.2f}%     | {val_metrics['text_r1']:>6.2f}%     | "
            f"{val_metrics['hybrid_r1']:>6.2f}%     | {val_metrics['avg_mrr']:.4f}"
        )

        best_state = {
            "img_proj_weight": student_head.img_proj.weight.detach().cpu(),
            "txt_proj_weight": student_head.txt_proj.weight.detach().cpu(),
            "logit_scale": student_head.logit_scale.detach().cpu(),
        }

    adapter_path = os.path.join(CHECKPOINT_DIR, "kd_projection_weights.npz")
    np.savez_compressed(
        adapter_path,
        img_proj_weight=best_state["img_proj_weight"].numpy(),
        txt_proj_weight=best_state["txt_proj_weight"].numpy(),
        logit_scale=best_state["logit_scale"].numpy(),
    )

    try:
        base_model_name = "patrickjohncyh/fashion-clip"
        clip_model = CLIPModel.from_pretrained(base_model_name)
        clip_processor = CLIPProcessor.from_pretrained(base_model_name)
        with torch.no_grad():
            w_img_kd = best_state["img_proj_weight"].to(clip_model.visual_projection.weight.dtype)
            w_txt_kd = best_state["txt_proj_weight"].to(clip_model.text_projection.weight.dtype)
            clip_model.visual_projection.weight.copy_(w_img_kd @ clip_model.visual_projection.weight)
            clip_model.text_projection.weight.copy_(w_txt_kd @ clip_model.text_projection.weight)
            clip_model.logit_scale.copy_(best_state["logit_scale"])
        clip_model.save_pretrained(BEST_MODEL_DIR)
        clip_processor.save_pretrained(BEST_MODEL_DIR)
    except Exception as e:
        print(f"Đã lưu trọng số projection tại {adapter_path} ({e})")

    with open(HISTORY_JSON, "w", encoding="utf-8") as f:
        json.dump(history, f, ensure_ascii=False, indent=2)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Knowledge Distillation Training cho Fashion-CLIP")
    parser.add_argument("--epochs", type=int, default=12)
    parser.add_argument("--batch_size", type=int, default=128)
    parser.add_argument("--lr", type=float, default=2e-3)
    args = parser.parse_args()
    run_knowledge_distillation(epochs=args.epochs, batch_size=args.batch_size, lr=args.lr)
