
import os
from functools import lru_cache

from dotenv import load_dotenv
from qdrant_client import QdrantClient, models

from app.rag.embedding import get_vector_size

load_dotenv()

COLLECTION = os.getenv(
    "QDRANT_COLLECTION",
    "fashion_rag_products"
)


@lru_cache(maxsize=1)
def get_qdrant_client():
    return QdrantClient(
        url=os.getenv(
            "QDRANT_URL",
            "http://127.0.0.1:6333"
        ),
        timeout=30
    )


def ensure_collection():
    client = get_qdrant_client()

    if not client.collection_exists(COLLECTION):
        client.create_collection(
            collection_name=COLLECTION,
            vectors_config=models.VectorParams(
                size=get_vector_size(),
                distance=models.Distance.COSINE
            )
        )

    else:
        info = client.get_collection(COLLECTION)
        actual_size = info.config.params.vectors.size

        if actual_size != get_vector_size():
            raise RuntimeError(
                "Kích thước vector không khớp với collection. "
                "Hãy kiểm tra embedding model."
            )


def upsert_products(points):
    ensure_collection()

    if not points:
        return

    get_qdrant_client().upsert(
        collection_name=COLLECTION,
        points=points,
        wait=True
    )


def search_products(vector, top_k=5, query_filter=None):
    # Không kiểm tra collection mỗi lần tìm kiếm.
    # Collection phải được tạo trước khi chatbot truy vấn.

    result = get_qdrant_client().query_points(
        collection_name=COLLECTION,
        query=vector,
        query_filter=query_filter,
        limit=top_k,
        with_payload=True
    )

    return result.points
