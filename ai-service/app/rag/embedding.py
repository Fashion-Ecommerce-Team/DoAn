import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

cache_dir = os.getenv(
    "HF_HOME",
    "D:/AIModels/huggingface"
)
Path(cache_dir).mkdir(parents=True, exist_ok=True)
os.environ["HF_HOME"] = cache_dir

from functools import lru_cache
from sentence_transformers import SentenceTransformer


MODEL_NAME = os.getenv(
    "RAG_EMBEDDING_MODEL",
    "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
)


@lru_cache(maxsize=1)
def get_embedding_model():
    return SentenceTransformer(
        MODEL_NAME,
        cache_folder=cache_dir
    )


def embed_text(text: str) -> list[float]:
    model = get_embedding_model()

    vector = model.encode(
        text,
        normalize_embeddings=True
    )

    return vector.tolist()


def get_vector_size() -> int:
    model = get_embedding_model()
    return model.get_sentence_embedding_dimension()


def product_to_text(product: dict) -> str:
    variants = product.get("variants") or []

    sizes = sorted({
        str(v.get("size"))
        for v in variants
        if v.get("size")
    })

    colors = sorted({
        str(v.get("color"))
        for v in variants
        if v.get("color")
    })

    return "\n".join([
        f"Tên sản phẩm: {product.get('name') or ''}",
        f"Mô tả: {product.get('description') or ''}",
        f"Danh mục: {product.get('categoryName') or ''}",
        f"Thương hiệu: {product.get('brandName') or ''}",
        f"Giới tính: {product.get('gender') or ''}",
        f"Size: {', '.join(sizes)}",
        f"Màu sắc: {', '.join(colors)}",
    ])