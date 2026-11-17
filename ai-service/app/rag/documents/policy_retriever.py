
from app.rag.documents.document_embedding import (
    embed_document
)

from app.rag.documents.policy_vector_store import (
    COLLECTION,
    get_policy_qdrant_client
)


def retrieve_policies(
    query: str,
    top_k: int = 3
) -> list[dict]:
    """
    Tìm các điều khoản chính sách liên quan
    bằng semantic search trong Qdrant.
    """
    if not query.strip():
        return []

    if top_k < 1:
        raise ValueError("top_k phải lớn hơn 0")

    vector = embed_document(query)

    client = get_policy_qdrant_client()

    results = client.query_points(
        collection_name=COLLECTION,
        query=vector,
        limit=top_k,
        with_payload=True
    ).points

    policies = []

    for point in results:
        payload = point.payload or {}

        policies.append({
            "source": payload.get("source"),
            "article": payload.get("article"),
            "page": payload.get("page"),
            "page_end": payload.get("page_end"),
            "text": payload.get("text", ""),
            "similarity_score": point.score
        })

    return policies
