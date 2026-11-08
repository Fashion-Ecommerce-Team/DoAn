
from fastapi import APIRouter, HTTPException

from app.models.chat_schemas import ChatRequest, ChatResponse
from app.rag.llm import chat_with_rag
from app.rag.product_sync import sync_products

from app.rag.documents.document_sync import (
    sync_policy_documents
)

router = APIRouter(
    prefix="/api/v1/ai",
    tags=["RAG Chatbot"]
)


@router.post("/rag/sync-products")
def sync_rag_products():
    try:
        total = sync_products()

        return {
            "success": True,
            "message": "Đồng bộ sản phẩm vào Qdrant thành công.",
            "total": total
        }

    except Exception as e:
        print(f"[PRODUCT SYNC ERROR] {e}")

        raise HTTPException(
            status_code=503,
            detail="Không thể đồng bộ sản phẩm."
        )


@router.post("/rag/sync-policies")
def sync_rag_policies():
    try:
        total = sync_policy_documents()

        return {
            "success": True,
            "message": "Đồng bộ tài liệu chính sách thành công.",
            "total": total
        }

    except Exception as e:
        print(f"[POLICY SYNC ERROR] {e}")

        raise HTTPException(
            status_code=503,
            detail="Không thể đồng bộ tài liệu chính sách."
        )


@router.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest):
    try:
        reply = chat_with_rag(request.message.strip())

        return ChatResponse(
            success=True,
            message="Chatbot RAG trả lời thành công!",
            reply=reply
        )

    except Exception as e:
        print(f"[RAG ERROR] {type(e).__name__}: {e}")

        raise HTTPException(
            status_code=503,
            detail="Chatbot RAG tạm thời không khả dụng."
        )
