
import re
import time
from qdrant_client import models

from app.rag.embedding import embed_text
from app.rag.vector_store import search_products


def extract_max_price(message: str):
    match = re.search(
        r"(?:dưới|không quá|tối đa)\s*"
        r"(\d[\d.,]*)\s*"
        r"(triệu|nghìn|ngàn|k|đồng|vnd)?",
        message.lower()
    )

    if not match:
        return None

    value = float(match.group(1).replace(",", "."))
    unit = match.group(2)

    if unit == "triệu":
        return value * 1_000_000

    if unit in ("nghìn", "ngàn", "k"):
        return value * 1000

    if "." in match.group(1) and unit in ("đồng", "vnd", None):
        return float(match.group(1).replace(".", ""))

    return value


def retrieve_products(message: str, top_k: int = 5):
    total_start = time.perf_counter()

    # 1. Embedding - chỉ gọi một lần
    embedding_start = time.perf_counter()
    vector = embed_text(message)
    embedding_time = time.perf_counter() - embedding_start

    # 2. Tạo bộ lọc
    filter_start = time.perf_counter()

    max_price = extract_max_price(message)

    conditions = [
        models.FieldCondition(
            key="in_stock",
            match=models.MatchValue(value=True)
        )
    ]

    if max_price is not None:
        conditions.append(
            models.FieldCondition(
                key="price",
                range=models.Range(lte=max_price)
            )
        )

    query_filter = models.Filter(must=conditions)
    filter_time = time.perf_counter() - filter_start

    # 3. Qdrant - chỉ gọi một lần
    qdrant_start = time.perf_counter()

    results = search_products(
        vector=vector,
        top_k=top_k,
        query_filter=query_filter
    )

    qdrant_time = time.perf_counter() - qdrant_start

    # 4. Chuyển đổi kết quả
    products = [
        {
            **point.payload,
            "similarity_score": point.score
        }
        for point in results
    ]

    total_time = time.perf_counter() - total_start

    print("\n========== RAG RETRIEVAL ==========")
    print(f"[TIME] Embedding: {embedding_time:.3f}s")
    print(f"[TIME] Filter: {filter_time:.3f}s")
    print(f"[TIME] Qdrant Search: {qdrant_time:.3f}s")
    print(f"[TIME] Total Retrieval: {total_time:.3f}s")
    print(f"[RAG] Retrieved Products: {len(products)}")
    print("===================================\n")

    return products
