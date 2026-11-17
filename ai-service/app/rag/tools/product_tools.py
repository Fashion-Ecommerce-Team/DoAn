
import traceback

from app.rag.retriever import retrieve_products


def search_products(query: str, top_k: int = 5) -> dict:
    """
    Tìm kiếm sản phẩm bằng Product RAG.
    """

    if not isinstance(query, str) or not query.strip():
        return {
            "success": False,
            "message": "Nội dung tìm kiếm không được để trống.",
            "products": []
        }

    try:
        top_k = max(1, min(int(top_k), 10))

        print(f"[PRODUCT TOOL] Query: {query}")
        print(f"[PRODUCT TOOL] Top K: {top_k}")

        products = retrieve_products(
            message=query.strip(),
            top_k=top_k
        )

        print(f"[PRODUCT TOOL] Found: {len(products)} products")

        return {
            "success": True,
            "query": query.strip(),
            "total": len(products),
            "products": products
        }

    except Exception as e:
        print("[PRODUCT TOOL ERROR]", repr(e))
        traceback.print_exc()

        return {
            "success": False,
            "message": "Không thể tìm kiếm sản phẩm lúc này.",
            "products": []
        }
