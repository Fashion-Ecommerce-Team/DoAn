
from fastapi import APIRouter, HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.models.chat_schemas import ChatRequest, ChatResponse
from app.rag.llm import chat_with_function_calling
from app.rag.product_sync import sync_products

from app.rag.documents.document_sync import (
    sync_policy_documents
)

router = APIRouter(
    prefix="/api/v1/ai",
    tags=["RAG Chatbot"]
)

# JWT Bearer cho Swagger UI
# auto_error=False: cho phép chat khi chưa đăng nhập
bearer_scheme = HTTPBearer(
    scheme_name="JWT Bearer",
    description="Nhập JWT của tài khoản đã đăng nhập.",
    auto_error=False
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
def chat(
    request: ChatRequest,
    credentials: HTTPAuthorizationCredentials | None = Security(
        bearer_scheme
    )
):
    try:
        # Lấy JWT từ Swagger hoặc Frontend
        access_token = None

        if credentials:
            access_token = credentials.credentials

        # Gemini Function Calling
        reply = chat_with_function_calling(
            message=request.message.strip(),
            access_token=access_token
        )

        return ChatResponse(
            success=True,
            message="Chatbot trả lời thành công!",
            reply=reply
        )

    except HTTPException:
        raise

    except Exception as e:
        print(f"[CHAT ERROR] {type(e).__name__}: {e}")

        raise HTTPException(
            status_code=503,
            detail="Chatbot tạm thời không khả dụng."
        )
