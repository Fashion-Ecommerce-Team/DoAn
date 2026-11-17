
import os
from functools import lru_cache

from qdrant_client import QdrantClient, models


COLLECTION = "fashion_rag_policies"

QDRANT_URL = os.getenv(
    "QDRANT_URL",
    "http://127.0.0.1:6333"
)

VECTOR_SIZE = 768


@lru_cache(maxsize=1)
def get_policy_qdrant_client():
    return QdrantClient(
        url=QDRANT_URL,
        timeout=30
    )


def ensure_policy_collection():
    client = get_policy_qdrant_client()

    if not client.collection_exists(COLLECTION):
        client.create_collection(
            collection_name=COLLECTION,
            vectors_config=models.VectorParams(
                size=VECTOR_SIZE,
                distance=models.Distance.COSINE
            )
        )

        print(f"[POLICY] Created collection: {COLLECTION}")
    else:
        info = client.get_collection(COLLECTION)
        vector_config = info.config.params.vectors

        if (
            vector_config.size != VECTOR_SIZE
            or vector_config.distance != models.Distance.COSINE
        ):
            raise ValueError(
                "Collection hiện tại không tương thích "
                "với model embedding BKAI."
            )

        print(f"[POLICY] Collection exists: {COLLECTION}")


def upsert_policy_chunks(
    chunks: list[dict],
    vectors: list[list[float]]
):
    if len(chunks) != len(vectors):
        raise ValueError(
            "Số chunks và vectors không khớp."
        )

    ensure_policy_collection()

    client = get_policy_qdrant_client()

    points = []

    for chunk, vector in zip(chunks, vectors):
        # ID ổn định khi đồng bộ lại cùng một điều khoản.
        import uuid

        point_id = str(
            uuid.uuid5(
                uuid.NAMESPACE_URL,
                (
                    f"{chunk['source']}:"
                    f"{chunk['article']}:"
                    f"{chunk['chunk_index']}"
                )
            )
        )

        points.append(
            models.PointStruct(
                id=point_id,
                vector=vector,
                payload={
                    "source": chunk["source"],
                    "page": chunk["page"],
                    "page_end": chunk["page_end"],
                    "article": chunk["article"],
                    "chunk_index": chunk["chunk_index"],
                    "text": chunk["text"],
                    "char_count": chunk["char_count"],
                    "document_type": "policy"
                }
            )
        )

    if points:
        client.upsert(
            collection_name=COLLECTION,
            points=points,
            wait=True
        )

    print(f"[POLICY] Upserted {len(points)} chunks")
