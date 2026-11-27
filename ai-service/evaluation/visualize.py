import json
import os
import sys

import matplotlib.pyplot as plt
import numpy as np

if sys.stdout.encoding != "utf-8":
    sys.stdout.reconfigure(encoding="utf-8")

plt.rcParams["font.sans-serif"] = ["DejaVu Sans", "Arial", "Segoe UI"]
plt.rcParams["axes.unicode_minus"] = False

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
RESULTS_PATH = os.path.join(SCRIPT_DIR, "data", "evaluation_results.json")
REPORTS_DIR = os.path.join(SCRIPT_DIR, "reports")


def plot_retrieval_comparison(results):
    summary = results["benchmark_summary"]
    methods = list(summary.keys())
    metrics = ["Recall@1 (Top-1)", "Recall@5 (Hàng đầu)", "Recall@10 (Trang đầu)", "MRR (x100)"]

    def get_scores(method_key):
        overall = summary[method_key]["overall"]
        return [overall["Recall@1"], overall["Recall@5"], overall["Recall@10"], overall["MRR"] * 100]

    text_scores = get_scores(methods[0])
    img_scores = get_scores(methods[1])
    hyb_scores = get_scores(methods[2])

    x = np.arange(len(metrics))
    width = 0.26

    fig, ax = plt.subplots(figsize=(11, 6.5), dpi=300)
    fig.patch.set_facecolor("#ffffff")
    ax.set_facecolor("#f8fafc")

    r1 = ax.bar(x - width, text_scores, width, label="Văn bản (Text Search)", color="#3b82f6", edgecolor="#1d4ed8")
    r2 = ax.bar(x, img_scores, width, label="Hình ảnh (Image Search)", color="#94a3b8", edgecolor="#64748b")
    r3 = ax.bar(x + width, hyb_scores, width, label="Kết hợp (Hybrid Search)", color="#10b981", edgecolor="#047857")

    ax.set_ylabel("Tỷ lệ (%)", fontsize=12, fontweight="bold", color="#1e293b")
    ax.set_title(
        "So Sánh Hiệu Năng Truy Xuất: Text vs Image vs Hybrid Search (N = 500)",
        fontsize=13,
        fontweight="bold",
        pad=18,
        color="#0f172a",
    )
    ax.set_xticks(x)
    ax.set_xticklabels(metrics, fontsize=11, fontweight="semibold")
    ax.legend(frameon=True, facecolor="white", edgecolor="#cbd5e1", fontsize=10.5, loc="upper left")
    ax.set_ylim(0, 118)
    ax.grid(axis="y", linestyle="--", alpha=0.5, color="#94a3b8")

    def autolabel(rects, is_highlight=False):
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
                color="#047857" if is_highlight else "#1e293b",
            )

    autolabel(r1)
    autolabel(r2)
    autolabel(r3, is_highlight=True)

    plt.tight_layout()
    out_path = os.path.join(REPORTS_DIR, "retrieval_benchmark_comparison.png")
    plt.savefig(out_path, dpi=300)
    plt.close()
    return out_path


def plot_category_benchmark(results):
    summary = results["benchmark_summary"]
    methods = list(summary.keys())
    categories = ["Apparel", "Footwear", "Accessories"]
    cat_vn = [
        "Trang phục\n(Apparel - 275 mẫu)",
        "Giày dép\n(Footwear - 125 mẫu)",
        "Phụ kiện\n(Accessories - 100 mẫu)",
    ]

    text_r1 = [summary[methods[0]]["by_category"][c]["Recall@1"] for c in categories]
    img_r1 = [summary[methods[1]]["by_category"][c]["Recall@1"] for c in categories]
    hyb_r1 = [summary[methods[2]]["by_category"][c]["Recall@1"] for c in categories]

    x = np.arange(len(categories))
    width = 0.26

    fig, ax = plt.subplots(figsize=(10, 6), dpi=300)
    fig.patch.set_facecolor("#ffffff")
    ax.set_facecolor("#f8fafc")

    r1 = ax.bar(x - width, text_r1, width, label="Văn bản (Text Search)", color="#3b82f6", edgecolor="#1d4ed8")
    r2 = ax.bar(x, img_r1, width, label="Hình ảnh (Image Search)", color="#94a3b8", edgecolor="#64748b")
    r3 = ax.bar(x + width, hyb_r1, width, label="Kết hợp (Hybrid Search)", color="#10b981", edgecolor="#047857")

    ax.set_ylabel("Recall@1 / Top-1 Accuracy (%)", fontsize=12, fontweight="bold", color="#1e293b")
    ax.set_title(
        "Độ Chính Xác Tuyệt Đối (Recall@1) Theo Từng Danh Mục Thời Trang",
        fontsize=13,
        fontweight="bold",
        pad=18,
        color="#0f172a",
    )
    ax.set_xticks(x)
    ax.set_xticklabels(cat_vn, fontsize=11, fontweight="semibold")
    ax.legend(frameon=True, facecolor="white", edgecolor="#cbd5e1", fontsize=10.5, loc="upper left")
    ax.set_ylim(0, 115)
    ax.grid(axis="y", linestyle="--", alpha=0.5, color="#94a3b8")

    def autolabel(rects, is_hyb=False):
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

    autolabel(r1)
    autolabel(r2)
    autolabel(r3, is_hyb=True)

    plt.tight_layout()
    out_path = os.path.join(REPORTS_DIR, "category_benchmark.png")
    plt.savefig(out_path, dpi=300)
    plt.close()
    return out_path


def main():
    os.makedirs(REPORTS_DIR, exist_ok=True)
    with open(RESULTS_PATH, "r", encoding="utf-8") as f:
        results = json.load(f)

    p1 = plot_retrieval_comparison(results)
    p2 = plot_category_benchmark(results)
    print(f"Đã xuất biểu đồ:\n - {p1}\n - {p2}")


if __name__ == "__main__":
    main()
