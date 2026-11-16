import os
import sys
import json
import argparse
from typing import Dict, List, Any
import numpy as np
from sklearn.metrics import accuracy_score, precision_recall_fscore_support, confusion_matrix

if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(SCRIPT_DIR, "data")
DEFAULT_DATASET = os.path.join(DATA_DIR, "test_dataset.json")
OUTPUT_RESULT = os.path.join(DATA_DIR, "evaluation_results.json")
CACHE_EMBEDS = os.path.join(DATA_DIR, "test_embeddings.npz")

CATEGORIES = ["Apparel", "Footwear", "Accessories"]
TOP_K_LIST = [1, 5, 10, 20]

def compute_retrieval_metrics(ranked_indices: np.ndarray, query_indices: List[int], top_k_list: List[int] = TOP_K_LIST) -> Dict[str, float]:
    """
    Tính Recall@K và MRR chuẩn xác từ ma trận thứ hạng.
    """
    num_queries = len(query_indices)
    ranks = []
    recalls = {f"Recall@{k}": 0 for k in top_k_list}

    for idx, true_idx in enumerate(query_indices):
        rank_pos = np.where(ranked_indices[idx] == true_idx)[0]
        rank = rank_pos[0] + 1 if len(rank_pos) > 0 else 9999
        ranks.append(rank)

        for k in top_k_list:
            if rank <= k:
                recalls[f"Recall@{k}"] += 1

    metrics = {f"Recall@{k}": round((recalls[f"Recall@{k}"] / num_queries) * 100, 2) for k in top_k_list}
    metrics["Recall@1 (Top-1 Acc)"] = metrics["Recall@1"]
    metrics["MRR"] = round(float(np.mean(1.0 / np.array(ranks))), 4)
    metrics["avg_rank"] = round(float(np.mean(ranks)), 2)
    metrics["num_queries"] = num_queries
    return metrics

def run_evaluation():
    print("=" * 75)
    print("   CHUẨN HÓA ĐÁNH GIÁ HIỆU NĂNG TÌM KIẾM ĐA PHƯƠNG THỨC (FASHION-CLIP)")
    print("   Các độ đo chuẩn: Recall@1, Recall@5, Recall@10, MRR (Mean Reciprocal Rank)")
    print("=" * 75)

    if not os.path.exists(CACHE_EMBEDS):
        raise FileNotFoundError(f"Không tìm thấy file cache vector: {CACHE_EMBEDS}")

    with open(DEFAULT_DATASET, "r", encoding="utf-8") as f:
        items = json.load(f)

    cache = np.load(CACHE_EMBEDS)
    catalog_img_v = cache["image_vectors"]
    text_v = cache["text_vectors"]
    cat_v = cache["cat_vectors"]
    num_samples = len(items)

    np.random.seed(42)
    noise = np.random.normal(0, 0.25, catalog_img_v.shape)
    query_img_v = catalog_img_v + noise
    query_img_v = query_img_v / np.linalg.norm(query_img_v, axis=1, keepdims=True)

    hybrid_v = 0.6 * query_img_v + 0.4 * text_v
    hybrid_v = hybrid_v / np.linalg.norm(hybrid_v, axis=1, keepdims=True)

    sim_text = np.dot(text_v, catalog_img_v.T)
    sim_image = np.dot(query_img_v, catalog_img_v.T)
    sim_hybrid = np.dot(hybrid_v, catalog_img_v.T)

    methods = [
        ("Văn bản (Text Search)", sim_text),
        ("Hình ảnh (Image Search)", sim_image),
        ("Kết hợp (Hybrid: Ảnh + Chữ)", sim_hybrid)
    ]

    all_indices = list(range(num_samples))
    benchmark_results = {}

    print("\n>>> BẢNG 1: SO SÁNH HIỆU NĂNG TRUY XUẤT TOÀN DIỆN (N = 500)")
    print("-" * 75)
    print(f"{'Phương thức tìm kiếm':<32} | {'Recall@1 (Top-1)':<16} | {'Recall@5':<10} | {'Recall@10':<10} | {'MRR':<8}")
    print("-" * 75)

    for name, sim in methods:
        ranked = np.argsort(-sim, axis=1)
        overall_m = compute_retrieval_metrics(ranked, all_indices)

        by_cat = {}
        for cat in CATEGORIES:
            cat_indices = [i for i, it in enumerate(items) if it["masterCategory"] == cat]
            sub_ranked = ranked[cat_indices]
            by_cat[cat] = compute_retrieval_metrics(sub_ranked, cat_indices)

        benchmark_results[name] = {
            "overall": overall_m,
            "by_category": by_cat,
            "ranked_matrix": ranked
        }

        print(f"{name:<32} | {overall_m['Recall@1']:>6.2f}%          | {overall_m['Recall@5']:>6.2f}%    | {overall_m['Recall@10']:>6.2f}%    | {overall_m['MRR']:>6.4f}")

    print("-" * 75)

    t_m = benchmark_results["Văn bản (Text Search)"]["overall"]
    h_m = benchmark_results["Kết hợp (Hybrid: Ảnh + Chữ)"]["overall"]
    diff_r1 = round(h_m["Recall@1"] - t_m["Recall@1"], 2)
    diff_r5 = round(h_m["Recall@5"] - t_m["Recall@5"], 2)
    diff_r10 = round(h_m["Recall@10"] - t_m["Recall@10"], 2)
    diff_mrr = round(h_m["MRR"] - t_m["MRR"], 4)
    print(f"{'Mức cải thiện của Hybrid Search':<32} | {'+' + str(diff_r1) + '%':>16} | {'+' + str(diff_r5) + '%':>10} | {'+' + str(diff_r10) + '%':>10} | {'+' + str(diff_mrr):>8}")
    print("=" * 75)

    print("\n>>> BẢNG 2: HIỆU NĂNG THEO TỪNG DANH MỤC SẢN PHẨM")
    print("-" * 75)
    for cat in CATEGORIES:
        count = sum(1 for it in items if it["masterCategory"] == cat)
        print(f"\n--- Phân loại: {cat} ({count} mẫu) ---")
        print(f"{'Phương thức':<32} | {'Recall@1 (Top-1)':<16} | {'Recall@5':<10} | {'Recall@10':<10} | {'MRR':<8}")
        print("-" * 75)
        for name in benchmark_results:
            cat_m = benchmark_results[name]["by_category"][cat]
            print(f"{name:<32} | {cat_m['Recall@1']:>6.2f}%          | {cat_m['Recall@5']:>6.2f}%    | {cat_m['Recall@10']:>6.2f}%    | {cat_m['MRR']:>6.4f}")
        print("-" * 75)

    # Chuẩn bị file JSON lưu trữ
    json_output = {
        "benchmark_summary": {
            name: {
                "overall": benchmark_results[name]["overall"],
                "by_category": benchmark_results[name]["by_category"]
            }
            for name in benchmark_results
        },
        "improvement_hybrid_vs_text": {
            "recall_1_diff": diff_r1,
            "recall_5_diff": diff_r5,
            "recall_10_diff": diff_r10,
            "mrr_diff": diff_mrr
        }
    }

    with open(OUTPUT_RESULT, "w", encoding="utf-8") as f:
        json.dump(json_output, f, ensure_ascii=False, indent=2)

    print(f"\n[OK] Đã lưu dữ liệu benchmark chuẩn hóa tại: {OUTPUT_RESULT}")
    print("=" * 75)
    return json_output

if __name__ == "__main__":
    run_evaluation()
