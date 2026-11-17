
import traceback

from app.rag.documents.policy_retriever import retrieve_policies


def search_policies(query: str, top_k: int = 3) -> dict:
    """
    Tìm kiếm chính sách cửa hàng bằng Policy RAG.
    """

    if not isinstance(query, str) or not query.strip():
        return {
            "success": False,
            "message": "Câu hỏi về chính sách không được để trống.",
            "policies": []
        }

    try:
        top_k = max(1, min(int(top_k), 10))

        print(f"[POLICY TOOL] Query: {query}")
        print(f"[POLICY TOOL] Top K: {top_k}")

        policies = retrieve_policies(
            query=query.strip(),
            top_k=top_k
        )

        print(f"[POLICY TOOL] Found: {len(policies)} policies")

        return {
            "success": True,
            "query": query.strip(),
            "total": len(policies),
            "policies": policies
        }

    except Exception as e:
        print("[POLICY TOOL ERROR]", repr(e))
        traceback.print_exc()

        return {
            "success": False,
            "message": "Không thể tra cứu chính sách lúc này.",
            "policies": []
        }
