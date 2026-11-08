
from pathlib import Path

from app.rag.documents.loader import load_policy_document
from app.rag.documents.chunker import chunk_documents

from app.rag.documents.document_embedding import (
    embed_documents,
    count_tokens,
    get_max_sequence_length
)

from app.rag.documents.policy_vector_store import (
    upsert_policy_chunks
)


RAG_DIR = Path(__file__).resolve().parent.parent
POLICIES_DIR = RAG_DIR / "data" / "policies"


def sync_policy_documents():
    if not POLICIES_DIR.exists():
        raise FileNotFoundError(
            f"Không tìm thấy thư mục: {POLICIES_DIR}"
        )

    all_chunks = []

    for file_path in sorted(POLICIES_DIR.iterdir()):
        if file_path.suffix.lower() not in (".pdf", ".docx"):
            continue

        print(f"[POLICY] Reading: {file_path.name}")

        documents = load_policy_document(str(file_path))

        chunks = chunk_documents(
            documents,
            chunk_size=700,
            chunk_overlap=100
        )

        all_chunks.extend(chunks)

        print(
            f"[POLICY] {file_path.name}: "
            f"{len(chunks)} chunks"
        )

    if not all_chunks:
        print("[POLICY] Không có chunks để đồng bộ")
        return 0

    max_length = get_max_sequence_length()

    for chunk in all_chunks:
        token_count = count_tokens(chunk["text"])

        if token_count > max_length:
            raise ValueError(
                f"Chunk vượt giới hạn token: "
                f"{chunk['source']} "
                f"Điều {chunk['article']} "
                f"({token_count}/{max_length})"
            )

    texts = [
        chunk["text"]
        for chunk in all_chunks
    ]

    print("[POLICY] Generating embeddings...")

    vectors = embed_documents(texts)

    print("[POLICY] Uploading to Qdrant...")

    upsert_policy_chunks(
        chunks=all_chunks,
        vectors=vectors
    )

    print(
        f"[POLICY] Sync completed: "
        f"{len(all_chunks)} chunks"
    )

    return len(all_chunks)
