"""
Script chuẩn hóa trực quan hóa kết quả đánh giá mô hình Fashion-CLIP (SEEME Benchmark)
Xuất 2 biểu đồ vector độ phân giải cao 300 DPI phục vụ báo cáo Đồ án tốt nghiệp:
1. retrieval_benchmark_comparison.png: So sánh Recall@1, Recall@5, Recall@10 và MRR giữa 3 phương thức
2. category_benchmark.png: Hiệu năng theo từng danh mục (Trang phục, Giày dép, Phụ kiện)
"""

import os
import sys
import json
import shutil
import numpy as np
import matplotlib.pyplot as plt

if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

plt.rcParams['font.sans-serif'] = ['DejaVu Sans', 'Arial', 'Segoe UI']
plt.rcParams['axes.unicode_minus'] = False

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(SCRIPT_DIR, "data")
RESULTS_PATH = os.path.join(DATA_DIR, "evaluation_results.json")
REPORTS_DIR = os.path.join(SCRIPT_DIR, "reports")
ARTIFACTS_DIR = r"C:\Users\msi\.gemini\antigravity\brain\0f2ace13-f22f-44cb-82c1-41b56a759e7b"

def plot_retrieval_comparison(results):
    summary = results["benchmark_summary"]
    methods = list(summary.keys())

    metrics = ['Recall@1 (Top-1)', 'Recall@5 (Hàng đầu)', 'Recall@10 (Trang đầu)', 'MRR (x100)']
    
    text_scores = [
        summary[methods[0]]["overall"]["Recall@1"],
        summary[methods[0]]["overall"]["Recall@5"],
        summary[methods[0]]["overall"]["Recall@10"],
        summary[methods[0]]["overall"]["MRR"] * 100
    ]
    img_scores = [
        summary[methods[1]]["overall"]["Recall@1"],
        summary[methods[1]]["overall"]["Recall@5"],
        summary[methods[1]]["overall"]["Recall@10"],
        summary[methods[1]]["overall"]["MRR"] * 100
    ]
    hyb_scores = [
        summary[methods[2]]["overall"]["Recall@1"],
        summary[methods[2]]["overall"]["Recall@5"],
        summary[methods[2]]["overall"]["Recall@10"],
        summary[methods[2]]["overall"]["MRR"] * 100
    ]

    x = np.arange(len(metrics))
    width = 0.26

    fig, ax = plt.subplots(figsize=(11, 6.5), dpi=300)
    fig.patch.set_facecolor('#ffffff')
    ax.set_facecolor('#f8fafc')

    r1 = ax.bar(x - width, text_scores, width, label='1. Chỉ dùng Văn bản (Text Search)', color='#3b82f6', edgecolor='#1d4ed8')
    r2 = ax.bar(x, img_scores, width, label='2. Chỉ dùng Hình ảnh (Image Search)', color='#94a3b8', edgecolor='#64748b')
    r3 = ax.bar(x + width, hyb_scores, width, label='3. Tìm kiếm Kết hợp (Hybrid Search)', color='#10b981', edgecolor='#047857')

    ax.set_ylabel('Tỷ lệ (%)', fontsize=12, fontweight='bold', color='#1e293b')
    ax.set_title('So Sánh Hiệu Năng Truy Xuất: Text-Only vs Image-Only vs Hybrid Multimodal Search\n(Tập kiểm thử chuẩn hóa N = 500)', fontsize=13, fontweight='bold', pad=18, color='#0f172a')
    ax.set_xticks(x)
    ax.set_xticklabels(metrics, fontsize=11, fontweight='semibold')
    ax.legend(frameon=True, facecolor='white', edgecolor='#cbd5e1', fontsize=10.5, loc='upper left')
    ax.set_ylim(0, 118)
    ax.grid(axis='y', linestyle='--', alpha=0.5, color='#94a3b8')

    def autolabel(rects, is_highlight=False):
        for rect in rects:
            h = rect.get_height()
            color = '#047857' if is_highlight else '#1e293b'
            ax.annotate(f'{h:.1f}%',
                        xy=(rect.get_x() + rect.get_width() / 2, h),
                        xytext=(0, 4), textcoords="offset points",
                        ha='center', va='bottom', fontsize=9.5, fontweight='bold', color=color)

    autolabel(r1)
    autolabel(r2)
    autolabel(r3, is_highlight=True)

    plt.tight_layout()
    out_path = os.path.join(REPORTS_DIR, "retrieval_benchmark_comparison.png")
    plt.savefig(out_path, dpi=300)
    plt.close()
    print(f" -> Đã tạo: {out_path}")
    return out_path

def plot_category_benchmark(results):
    summary = results["benchmark_summary"]
    methods = list(summary.keys())
    categories = ["Apparel", "Footwear", "Accessories"]
    cat_vn = ["Trang phục\n(Apparel - 275 mẫu)", "Giày dép\n(Footwear - 125 mẫu)", "Phụ kiện\n(Accessories - 100 mẫu)"]

    text_r1 = [summary[methods[0]]["by_category"][c]["Recall@1"] for c in categories]
    img_r1 = [summary[methods[1]]["by_category"][c]["Recall@1"] for c in categories]
    hyb_r1 = [summary[methods[2]]["by_category"][c]["Recall@1"] for c in categories]

    x = np.arange(len(categories))
    width = 0.26

    fig, ax = plt.subplots(figsize=(10, 6), dpi=300)
    fig.patch.set_facecolor('#ffffff')
    ax.set_facecolor('#f8fafc')

    r1 = ax.bar(x - width, text_r1, width, label='Văn bản (Text Search)', color='#3b82f6', edgecolor='#1d4ed8')
    r2 = ax.bar(x, img_r1, width, label='Hình ảnh (Image Search)', color='#94a3b8', edgecolor='#64748b')
    r3 = ax.bar(x + width, hyb_r1, width, label='Kết hợp (Hybrid Search)', color='#10b981', edgecolor='#047857')

    ax.set_ylabel('Recall@1 / Top-1 Accuracy (%)', fontsize=12, fontweight='bold', color='#1e293b')
    ax.set_title('Độ Chính Xác Tuyệt Đối (Recall@1) Theo Từng Danh Mục Thời Trang', fontsize=13, fontweight='bold', pad=18, color='#0f172a')
    ax.set_xticks(x)
    ax.set_xticklabels(cat_vn, fontsize=11, fontweight='semibold')
    ax.legend(frameon=True, facecolor='white', edgecolor='#cbd5e1', fontsize=10.5, loc='upper left')
    ax.set_ylim(0, 115)
    ax.grid(axis='y', linestyle='--', alpha=0.5, color='#94a3b8')

    def autolabel(rects, is_hyb=False):
        for rect in rects:
            h = rect.get_height()
            color = '#047857' if is_hyb else '#1e293b'
            ax.annotate(f'{h:.1f}%',
                        xy=(rect.get_x() + rect.get_width() / 2, h),
                        xytext=(0, 4), textcoords="offset points",
                        ha='center', va='bottom', fontsize=9.5, fontweight='bold', color=color)

    autolabel(r1)
    autolabel(r2)
    autolabel(r3, is_hyb=True)

    plt.tight_layout()
    out_path = os.path.join(REPORTS_DIR, "category_benchmark.png")
    plt.savefig(out_path, dpi=300)
    plt.close()
    print(f" -> Đã tạo: {out_path}")
    return out_path

def main():
    print("=== BẮT ĐẦU XUẤT 2 BIỂU ĐỒ TRỰC QUAN HÓA CỐT LÕI ===")
    os.makedirs(REPORTS_DIR, exist_ok=True)
    os.makedirs(ARTIFACTS_DIR, exist_ok=True)

    with open(RESULTS_PATH, "r", encoding="utf-8") as f:
        results = json.load(f)

    p1 = plot_retrieval_comparison(results)
    p2 = plot_category_benchmark(results)

    for p in [p1, p2]:
        if p and os.path.exists(p):
            fname = os.path.basename(p)
            dest = os.path.join(ARTIFACTS_DIR, fname)
            shutil.copyfile(p, dest)
            print(f" -> Đã đồng bộ sang Artifacts: {dest}")

    print("=== HOÀN TẤT TRỰC QUAN HÓA ===")
    print(f"Các biểu đồ được lưu tại: {REPORTS_DIR}")
    
    if "--open" in sys.argv or "-o" in sys.argv:
        print("Đang mở thư mục reports trong Windows Explorer...")
        os.system(f'explorer.exe "{REPORTS_DIR}"')

if __name__ == "__main__":
    main()
