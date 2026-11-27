import json
import os
import sys

import matplotlib.pyplot as plt
import numpy as np

if sys.stdout.encoding != "utf-8":
    sys.stdout.reconfigure(encoding="utf-8")

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
AI_SERVICE_DIR = os.path.dirname(SCRIPT_DIR)
EVAL_DATA_DIR = os.path.join(AI_SERVICE_DIR, "evaluation", "data")
CHECKPOINT_DIR = os.path.join(SCRIPT_DIR, "checkpoints")
REPORTS_DIR = os.path.join(SCRIPT_DIR, "reports")

TEST_DATASET_JSON = os.path.join(EVAL_DATA_DIR, "test_dataset.json")
TEST_EMBEDS_NPZ = os.path.join(EVAL_DATA_DIR, "test_embeddings.npz")
KD_WEIGHTS_NPZ = os.path.join(CHECKPOINT_DIR, "kd_projection_weights.npz")
HISTORY_JSON = os.path.join(CHECKPOINT_DIR, "kd_training_history.json")
COMPARISON_JSON = os.path.join(SCRIPT_DIR, "data", "kd_benchmark_comparison.json")

TOP_K_LIST = [1, 5, 10, 20]
CATEGORIES = ["Apparel", "Footwear", "Accessories"]


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


def l2_norm(mat: np.ndarray) -> np.ndarray:
    return mat / np.linalg.norm(mat, axis=1, keepdims=True)


def evaluate_model_vectors(cat_img_v: np.ndarray, q_img_v: np.ndarray, q_txt_v: np.ndarray, items: list) -> dict:
    hyb_v = l2_norm(0.6 * q_img_v + 0.4 * q_txt_v)
    methods = [
        ("Văn bản (Text Search)", np.dot(q_txt_v, cat_img_v.T)),
        ("Hình ảnh (Image Search)", np.dot(q_img_v, cat_img_v.T)),
        ("Kết hợp (Hybrid: Ảnh + Chữ)", np.dot(hyb_v, cat_img_v.T)),
    ]

    all_idx = list(range(len(items)))
    res = {}
    for name, sim in methods:
        ranked = np.argsort(-sim, axis=1)
        by_cat = {}
        for cat in CATEGORIES:
            c_idx = [i for i, it in enumerate(items) if it["masterCategory"] == cat]
            by_cat[cat] = compute_metrics(ranked[c_idx], c_idx)
        res[name] = {
            "overall": compute_metrics(ranked, all_idx),
            "by_category": by_cat,
        }
    return res


def plot_kd_reports(history: list, before_res: dict, after_res: dict):
    os.makedirs(REPORTS_DIR, exist_ok=True)
    plt.rcParams["font.sans-serif"] = ["Segoe UI", "Arial", "DejaVu Sans"]
    plt.rcParams["axes.unicode_minus"] = False

    epochs = [h["epoch"] for h in history]
    total_loss = [h["train_loss"] for h in history]
    nce_loss = [h["loss_infonce"] for h in history]
    feat_loss = [h["loss_feat"] for h in history]
    val_mrr = [h["avg_mrr"] * 100 for h in history]
    val_hyb_r1 = [h["hybrid_r1"] for h in history]

    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 5.5), dpi=300)
    ax1.plot(epochs, total_loss, "o-", color="#1e40af", linewidth=2.4, label="Tổng Loss (L_total)")
    ax1.plot(epochs, nce_loss, "s--", color="#0284c7", linewidth=1.8, label="Contrastive Loss (L_InfoNCE)")
    ax1.plot(epochs, feat_loss, "^:", color="#059669", linewidth=1.8, label="Feature Alignment Loss (L_feat)")
    ax1.set_title("Quá Trình Hội Tụ Hàm Mất Mát Chưng Cất (8.500 Mẫu Train)", fontsize=12, fontweight="bold", pad=12)
    ax1.set_xlabel("Epoch", fontsize=11)
    ax1.set_ylabel("Giá trị Loss", fontsize=11)
    ax1.grid(True, linestyle="--", alpha=0.4)
    ax1.legend(frameon=True, fontsize=9.5)

    ax2.plot(epochs, val_hyb_r1, "o-", color="#059669", linewidth=2.4, label="Validation Hybrid Recall@1 (%)")
    ax2.plot(epochs, val_mrr, "D--", color="#d97706", linewidth=2.0, label="Validation Avg MRR (x100)")
    ax2.set_title("Hiệu Năng Trên Tập Kiểm Định (1.000 Mẫu Validation)", fontsize=12, fontweight="bold", pad=12)
    ax2.set_xlabel("Epoch", fontsize=11)
    ax2.set_ylabel("Điểm hiệu năng (%)", fontsize=11)
    ax2.grid(True, linestyle="--", alpha=0.4)
    ax2.legend(frameon=True, fontsize=9.5)

    plt.tight_layout()
    chart1_path = os.path.join(REPORTS_DIR, "kd_training_convergence.png")
    plt.savefig(chart1_path, dpi=300)
    plt.close()

    methods = list(before_res.keys())
    short_labels = ["Tìm kiếm Văn bản\n(Text Search)", "Tìm kiếm Hình ảnh\n(Image Search)", "Tìm kiếm Kết hợp\n(Hybrid Search)"]

    r1_before = [before_res[m]["overall"]["Recall@1"] for m in methods]
    r1_after = [after_res[m]["overall"]["Recall@1"] for m in methods]
    mrr_before = [before_res[m]["overall"]["MRR"] * 100 for m in methods]
    mrr_after = [after_res[m]["overall"]["MRR"] * 100 for m in methods]

    x = np.arange(len(methods))
    width = 0.34

    fig, (ax_l, ax_r) = plt.subplots(1, 2, figsize=(14.5, 6), dpi=300)

    b1 = ax_l.bar(x - width / 2, r1_before, width, label="Trước Tuning (Baseline)", color="#64748b")
    b2 = ax_l.bar(x + width / 2, r1_after, width, label="Sau Knowledge Distillation", color="#2563eb")
    ax_l.set_title("So Sánh Recall@1 (Top-1 Accuracy) Trước & Sau Tuning", fontsize=12, fontweight="bold", pad=12)
    ax_l.set_xticks(x)
    ax_l.set_xticklabels(short_labels, fontsize=10, fontweight="bold")
    ax_l.set_ylim(0, 108)
    ax_l.set_ylabel("Recall@1 (%)", fontsize=11)
    ax_l.grid(axis="y", linestyle="--", alpha=0.4)
    ax_l.legend(loc="upper left", fontsize=9.5)

    for bars in (b1, b2):
        for bar in bars:
            h = bar.get_height()
            ax_l.annotate(
                f"{h:.2f}%",
                xy=(bar.get_x() + bar.get_width() / 2, h),
                xytext=(0, 4),
                textcoords="offset points",
                ha="center",
                va="bottom",
                fontsize=9.5,
                fontweight="bold",
            )

    m1 = ax_r.bar(x - width / 2, mrr_before, width, label="Trước Tuning (Baseline)", color="#64748b")
    m2 = ax_r.bar(x + width / 2, mrr_after, width, label="Sau Knowledge Distillation", color="#059669")
    ax_r.set_title("So Sánh Chỉ Số MRR (x100) Trước & Sau Tuning", fontsize=12, fontweight="bold", pad=12)
    ax_r.set_xticks(x)
    ax_r.set_xticklabels(short_labels, fontsize=10, fontweight="bold")
    ax_r.set_ylim(0, 108)
    ax_r.set_ylabel("MRR (%)", fontsize=11)
    ax_r.grid(axis="y", linestyle="--", alpha=0.4)
    ax_r.legend(loc="upper left", fontsize=9.5)

    for bars in (m1, m2):
        for bar in bars:
            h = bar.get_height()
            ax_r.annotate(
                f"{h / 100:.4f}",
                xy=(bar.get_x() + bar.get_width() / 2, h),
                xytext=(0, 4),
                textcoords="offset points",
                ha="center",
                va="bottom",
                fontsize=9.5,
                fontweight="bold",
            )

    plt.tight_layout()
    chart2_path = os.path.join(REPORTS_DIR, "kd_before_after_comparison.png")
    plt.savefig(chart2_path, dpi=300)
    plt.close()

    cat_vn = [
        "Trang phục\n(Apparel - 275 mẫu)",
        "Giày dép\n(Footwear - 125 mẫu)",
        "Phụ kiện\n(Accessories - 100 mẫu)",
    ]
    text_r1 = [after_res[methods[0]]["by_category"][c]["Recall@1"] for c in CATEGORIES]
    img_r1 = [after_res[methods[1]]["by_category"][c]["Recall@1"] for c in CATEGORIES]
    hyb_r1 = [after_res[methods[2]]["by_category"][c]["Recall@1"] for c in CATEGORIES]

    x_cat = np.arange(len(CATEGORIES))
    width_cat = 0.26

    fig, ax = plt.subplots(figsize=(10, 6), dpi=300)
    fig.patch.set_facecolor("#ffffff")
    ax.set_facecolor("#f8fafc")

    r1 = ax.bar(x_cat - width_cat, text_r1, width_cat, label="Văn bản (Text Search)", color="#3b82f6", edgecolor="#1d4ed8")
    r2 = ax.bar(x_cat, img_r1, width_cat, label="Hình ảnh (Image Search)", color="#94a3b8", edgecolor="#64748b")
    r3 = ax.bar(x_cat + width_cat, hyb_r1, width_cat, label="Kết hợp (Hybrid Search)", color="#10b981", edgecolor="#047857")

    ax.set_ylabel("Recall@1 / Top-1 Accuracy (%)", fontsize=12, fontweight="bold", color="#1e293b")
    ax.set_title(
        "Độ Chính Xác Tuyệt Đối (Recall@1) Theo Từng Danh Mục Thời Trang (Sau Tuning)",
        fontsize=12.5,
        fontweight="bold",
        pad=18,
        color="#0f172a",
    )
    ax.set_xticks(x_cat)
    ax.set_xticklabels(cat_vn, fontsize=11, fontweight="semibold")
    ax.legend(frameon=True, facecolor="white", edgecolor="#cbd5e1", fontsize=10.5, loc="upper left")
    ax.set_ylim(0, 115)
    ax.grid(axis="y", linestyle="--", alpha=0.5, color="#94a3b8")

    def autolabel_cat(rects, is_hyb=False):
        for rect in rects:
            h = rect.get_height()
            ax.annotate(
                f"{h:.1f}%",
                xy=(rect.get_x() + rect.get_width() / 2, h),
                xytext=(0, 4),
                textcoords="offset points",
                ha="center",
                va="bottom",
                fontsize=9.5,
                fontweight="bold",
                color="#047857" if is_hyb else "#1e293b",
            )

    autolabel_cat(r1)
    autolabel_cat(r2)
    autolabel_cat(r3, is_hyb=True)

    plt.tight_layout()
    chart3_path = os.path.join(REPORTS_DIR, "kd_category_benchmark.png")
    plt.savefig(chart3_path, dpi=300)
    plt.close()

    return chart1_path, chart2_path, chart3_path


def run_kd_evaluation():
    with open(TEST_DATASET_JSON, "r", encoding="utf-8") as f:
        items = json.load(f)

    cache = np.load(TEST_EMBEDS_NPZ)
    base_cat_img = cache["image_vectors"].astype(np.float32)
    base_txt = cache["text_vectors"].astype(np.float32)

    np.random.seed(42)
    base_q_img = l2_norm(base_cat_img + np.random.normal(0, 0.25, base_cat_img.shape).astype(np.float32))

    before_res = evaluate_model_vectors(base_cat_img, base_q_img, base_txt, items)

    kd_weights = np.load(KD_WEIGHTS_NPZ)
    w_img = kd_weights["img_proj_weight"].astype(np.float32)
    w_txt = kd_weights["txt_proj_weight"].astype(np.float32)

    after_res = evaluate_model_vectors(
        base_cat_img,
        l2_norm(base_q_img @ w_img.T),
        l2_norm(base_txt @ w_txt.T),
        items,
    )

    print(f"{'Phương thức tìm kiếm':<30} | {'Giai đoạn':<14} | {'Recall@1':<10} | {'Recall@5':<10} | {'Recall@10':<10} | {'MRR':<8}")
    print("-" * 92)

    summary_diff = {}
    for m_name in before_res:
        b = before_res[m_name]["overall"]
        a = after_res[m_name]["overall"]
        d_r1 = round(a["Recall@1"] - b["Recall@1"], 2)
        d_r5 = round(a["Recall@5"] - b["Recall@5"], 2)
        d_r10 = round(a["Recall@10"] - b["Recall@10"], 2)
        d_mrr = round(a["MRR"] - b["MRR"], 4)

        summary_diff[m_name] = {
            "Recall@1_gain": d_r1,
            "Recall@5_gain": d_r5,
            "Recall@10_gain": d_r10,
            "MRR_gain": d_mrr,
        }

        print(f"{m_name:<30} | {'Trước Tuning':<14} | {b['Recall@1']:>6.2f}%    | {b['Recall@5']:>6.2f}%    | {b['Recall@10']:>6.2f}%    | {b['MRR']:.4f}")
        print(f"{'':<30} | {'Sau Tuning':<14} | {a['Recall@1']:>6.2f}%    | {a['Recall@5']:>6.2f}%    | {a['Recall@10']:>6.2f}%    | {a['MRR']:.4f}")
        print("-" * 92)

    with open(HISTORY_JSON, "r", encoding="utf-8") as f:
        history = json.load(f)

    c1, c2, c3 = plot_kd_reports(history, before_res, after_res)

    with open(COMPARISON_JSON, "w", encoding="utf-8") as f:
        json.dump(
            {
                "before_tuning": before_res,
                "after_kd_tuning": after_res,
                "improvements": summary_diff,
            },
            f,
            ensure_ascii=False,
            indent=2,
        )

    print(f"Đã xuất biểu đồ báo cáo:\n - {c1}\n - {c2}\n - {c3}")


if __name__ == "__main__":
    run_kd_evaluation()
