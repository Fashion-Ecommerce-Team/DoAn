
import os
from functools import lru_cache

from pyvi import ViTokenizer
from sentence_transformers import SentenceTransformer


MODEL_NAME = "bkai-foundation-models/vietnamese-bi-encoder"

# Dùng chung vị trí cache với Product RAG.
# Không thay đổi code hoặc model của Product RAG.
CACHE_DIR = os.getenv(
    "HF_HOME",
    "D:/AIModels/huggingface"
)


@lru_cache(maxsize=1)
def get_document_embedding_model():
    """
    Tải model BKAI một lần và tái sử dụng.
    """
    print(f"[DOCUMENT EMBEDDING] Loading {MODEL_NAME}")

    model = SentenceTransformer(
        MODEL_NAME,
        cache_folder=CACHE_DIR
    )

    print("[DOCUMENT EMBEDDING] Model loaded")

    return model


def preprocess_vietnamese(text: str) -> str:
    """
    Tách từ tiếng Việt bằng PyVi.
    Ví dụ: 'giao hàng' -> 'giao_hàng'
    """
    return ViTokenizer.tokenize(text.strip())


def count_tokens(text: str) -> int:
    """
    Đếm số token sau khi tách từ tiếng Việt.
    """
    model = get_document_embedding_model()
    processed = preprocess_vietnamese(text)

    tokens = model.tokenizer(
        processed,
        add_special_tokens=True,
        truncation=False
    )

    return len(tokens["input_ids"])


def get_max_sequence_length() -> int:
    """
    Lấy giới hạn đầu vào mà SentenceTransformer
    đang cấu hình.
    """
    model = get_document_embedding_model()

    return model.max_seq_length


def get_document_vector_size() -> int:
    """
    Lấy số chiều vector embedding.
    """
    model = get_document_embedding_model()

    return model.get_sentence_embedding_dimension()


def embed_document(text: str) -> list[float]:
    """
    Tạo embedding cho một đoạn văn bản.
    """
    model = get_document_embedding_model()
    processed = preprocess_vietnamese(text)

    vector = model.encode(
        processed,
        normalize_embeddings=True,
        convert_to_numpy=True
    )

    return vector.tolist()


def embed_documents(texts: list[str]) -> list[list[float]]:
    """
    Tạo embedding theo batch để tăng hiệu suất.
    """
    if not texts:
        return []

    model = get_document_embedding_model()

    processed_texts = [
        preprocess_vietnamese(text)
        for text in texts
    ]

    vectors = model.encode(
        processed_texts,
        batch_size=16,
        show_progress_bar=True,
        normalize_embeddings=True,
        convert_to_numpy=True
    )

    return vectors.tolist()
