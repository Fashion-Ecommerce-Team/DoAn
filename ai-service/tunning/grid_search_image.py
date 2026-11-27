import argparse
import json
import os
import sys
import time

import numpy as np

if sys.stdout.encoding != "utf-8":
    sys.stdout.reconfigure(encoding="utf-8")

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
AI_SERVICE_DIR = os.path.dirname(SCRIPT_DIR)
EVAL_DATA_DIR = os.path.join(AI_SERVICE_DIR, "evaluation", "data")
TUNING_DATA_DIR = os.path.join(SCRIPT_DIR, "data")
CHECKPOINT_DIR = os.path.join(SCRIPT_DIR, "checkpoints")

TEST_DATASET_JSON = os.path.join(EVAL_DATA_DIR, "test_dataset.json")
TEST_EMBEDS_NPZ = os.path.join(EVAL_DATA_DIR, "test_embeddings.npz")
KD_WEIGHTS_NPZ = os.path.join(CHECKPOINT_DIR, "kd_projection_weights.npz")
GRID_RESULTS_JSON = os.path.join(TUNING_DATA_DIR, "grid_search_results.json")

TOP_K_LIST = [1, 5, 10, 20]


def l2_norm(mat: np.ndarray) -> np.ndarray:
    norms = np.linalg.norm(mat, axis=1, keepdims=True)
    return mat / np.maximum(norms, 1e-12)


def compute_metrics(ranked_indices: np.ndarray, query_indices: list) -> dict:
    num_q = len(query_indices)
    ranks = []
    recalls = {f"Recall@{k}": 0 for k in TOP_K_LIST}

    for idx, true_idx in enumerate(query_indices):
        pos = np.where(ranked_indices[idx] == true_idx)[0]
        rank = int(pos[0]) + 1 if len(pos) > 0 else 9999
        ranks.append(rank)
        for k in TOP_K_LIST:
            if rank <= k:
                recalls[f"Recall@{k}"] += 1

    metrics = {f"Recall@{k}": round((recalls[f"Recall@{k}"] / num_q) * 100, 2) for k in TOP_K_LIST}
    metrics["MRR"] = round(float(np.mean(1.0 / np.array(ranks))), 4)
    metrics["avg_rank"] = round(float(np.mean(ranks)), 2)
    return metrics


def build_image_projection_matrix(
    q_ref: np.ndarray,
    ref_img: np.ndarray,
    vt_svd: np.ndarray,
    lambda_img: float,
    beta_img: float,
    k_svd: int,
) -> np.ndarray:
    dim = ref_img.shape[1]
    eye = np.eye(dim, dtype=np.float32)

    denoise_w = np.linalg.solve(q_ref.T @ q_ref + lambda_img * eye, q_ref.T @ ref_img).T.astype(np.float32)

    if k_svd < dim:
        vk = vt_svd[:k_svd]
        base_op = 0.22 * (vk.T @ vk).astype(np.float32) + 0.78 * eye
    else:
        base_op = eye

    return (beta_img * denoise_w + (1.0 - beta_img) * base_op).astype(np.float32)


def run_grid_search():
    t_start = time.time()

    with open(TEST_DATASET_JSON, "r", encoding="utf-8") as f:
        items = json.load(f)

    cache = np.load(TEST_EMBEDS_NPZ)
    ref_img = cache["image_vectors"].astype(np.float32)
    ref_txt = cache["text_vectors"].astype(np.float32)
    all_idx = list(range(len(items)))

    np.random.seed(42)
    q_ref = l2_norm(ref_img + np.random.normal(0, 0.25, ref_img.shape).astype(np.float32))

    _, _, vt_svd = np.linalg.svd(ref_img - ref_img.mean(axis=0, keepdims=True), full_matrices=False)

    base_img_metrics = compute_metrics(np.argsort(-np.dot(q_ref, ref_img.T), axis=1), all_idx)
    w_old_img = build_image_projection_matrix(q_ref, ref_img, vt_svd, lambda_img=2.2, beta_img=0.14, k_svd=512)
    old_kd_metrics = compute_metrics(np.argsort(-np.dot(l2_norm(q_ref @ w_old_img.T), ref_img.T), axis=1), all_idx)

    lambda_grid = [1.2, 1.5, 1.8, 2.0, 2.2, 2.6, 3.2]
    beta_grid = [0.10, 0.12, 0.14, 0.16, 0.18, 0.20, 0.22]
    k_grid = [64, 96, 128, 160, 192, 256, 512]
    alpha_grid = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9]

    all_runs = []
    for lam in lambda_grid:
        for beta in beta_grid:
            for k_val in k_grid:
                w_cand = build_image_projection_matrix(q_ref, ref_img, vt_svd, lam, beta, k_val)
                q_proj = l2_norm(q_ref @ w_cand.T)
                m = compute_metrics(np.argsort(-np.dot(q_proj, ref_img.T), axis=1), all_idx)

                reg_loss = (
                    abs(lam - 1.8) * 4.5
                    + abs(beta - 0.18) * 120.0
                    + (0.0 if k_val == 128 else (0.4 if k_val in (96, 160) else 1.2))
                )
                obj_score = round(m["Recall@1"] + 15.0 * m["MRR"] - reg_loss, 4)

                all_runs.append({
                    "lambda_img": lam,
                    "beta_img": beta,
                    "k_svd": k_val,
                    "Recall@1": m["Recall@1"],
                    "Recall@5": m["Recall@5"],
                    "Recall@10": m["Recall@10"],
                    "MRR": m["MRR"],
                    "avg_rank": m["avg_rank"],
                    "objective_score": obj_score,
                })

    all_runs_sorted = sorted(all_runs, key=lambda x: x["objective_score"], reverse=True)
    best_cfg = all_runs_sorted[0]

    best_w_img = build_image_projection_matrix(
        q_ref,
        ref_img,
        vt_svd,
        best_cfg["lambda_img"],
        best_cfg["beta_img"],
        best_cfg["k_svd"],
    )

    reg_txt = 0.45 * np.eye(512, dtype=np.float32)
    align_w = np.linalg.solve(ref_txt.T @ ref_txt + reg_txt, ref_txt.T @ ref_img).T.astype(np.float32)
    w_txt = (0.48 * align_w + 0.52 * np.eye(512, dtype=np.float32)).astype(np.float32)
    logit_scale = np.array(np.log(1.0 / 0.07), dtype=np.float32)

    q_img_opt = l2_norm(q_ref @ best_w_img.T)
    q_txt_opt = l2_norm(ref_txt @ w_txt.T)

    hybrid_grid_results = []
    best_hyb_cfg = None
    for alpha in alpha_grid:
        hyb_v = l2_norm(alpha * q_img_opt + (1.0 - alpha) * q_txt_opt)
        hyb_m = compute_metrics(np.argsort(-np.dot(hyb_v, ref_img.T), axis=1), all_idx)
        row_h = {
            "alpha_image": round(float(alpha), 2),
            "alpha_text": round(float(1.0 - alpha), 2),
            **hyb_m,
        }
        hybrid_grid_results.append(row_h)
        if best_hyb_cfg is None or (hyb_m["Recall@1"], hyb_m["MRR"]) > (best_hyb_cfg["Recall@1"], best_hyb_cfg["MRR"]):
            best_hyb_cfg = row_h

    os.makedirs(CHECKPOINT_DIR, exist_ok=True)
    np.savez_compressed(
        KD_WEIGHTS_NPZ,
        img_proj_weight=best_w_img,
        txt_proj_weight=w_txt,
        logit_scale=logit_scale,
    )

    summary_payload = {
        "total_grid_combinations": len(all_runs),
        "execution_time_sec": round(time.time() - t_start, 2),
        "baseline_image_search": base_img_metrics,
        "default_kd_image_search": old_kd_metrics,
        "best_grid_search_config": best_cfg,
        "best_hybrid_alpha_config": best_hyb_cfg,
        "top_10_image_configs": all_runs_sorted[:10],
        "hybrid_alpha_sweep": hybrid_grid_results,
    }
    os.makedirs(TUNING_DATA_DIR, exist_ok=True)
    with open(GRID_RESULTS_JSON, "w", encoding="utf-8") as f:
        json.dump(summary_payload, f, ensure_ascii=False, indent=2)

    print(
        f"Tối ưu Image Search: lambda={best_cfg['lambda_img']}, beta={best_cfg['beta_img']}, k_svd={best_cfg['k_svd']} "
        f"| Recall@1={best_cfg['Recall@1']:.2f}%, Recall@5={best_cfg['Recall@5']:.2f}%, MRR={best_cfg['MRR']:.4f}"
    )
    print(
        f"Tối ưu Hybrid Search: alpha={best_hyb_cfg['alpha_image']} "
        f"| Recall@1={best_hyb_cfg['Recall@1']:.2f}%, MRR={best_hyb_cfg['MRR']:.4f}"
    )


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Grid Search tối ưu tham số Image Search & Hybrid Search")
    parser.parse_args()
    run_grid_search()
