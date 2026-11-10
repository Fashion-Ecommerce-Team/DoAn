from fastapi import APIRouter, HTTPException, Depends
from app.bkai.schemas import (
    TextEmbeddingRequest,
    BatchTextEmbeddingRequest,
    TextEmbeddingResponse,
    BatchTextEmbeddingResponse,
)
from app.bkai.model import get_bkai_model, BkaiBiEncoderModel
from app.core.config import settings
from app.core.logging import logger

router = APIRouter()

@router.post("/embed/text", response_model=TextEmbeddingResponse, summary="Sinh vector embedding 768d từ 1 đoạn văn bản")
def embed_text(
    payload: TextEmbeddingRequest,
    model: BkaiBiEncoderModel = Depends(get_bkai_model)
):
    try:
        vector = model.embed_text(payload.text)
        return TextEmbeddingResponse(
            success=True,
            dimension=len(vector),
            model=model.model_name,
            embedding=vector
        )
    except Exception as e:
        logger.error(f"Lỗi khi embed văn bản với BKAI Bi-Encoder: {e}")
        raise HTTPException(status_code=500, detail=f"BKAI Embedding failed: {str(e)}")

@router.post("/embed/texts", response_model=BatchTextEmbeddingResponse, summary="Sinh vector embedding 768d hàng loạt từ danh sách văn bản")
def embed_texts(
    payload: BatchTextEmbeddingRequest,
    model: BkaiBiEncoderModel = Depends(get_bkai_model)
):
    try:
        vectors = model.embed_texts(payload.texts)
        dim = len(vectors[0]) if vectors else settings.BKAI_VECTOR_DIMENSION
        return BatchTextEmbeddingResponse(
            success=True,
            dimension=dim,
            count=len(vectors),
            model=model.model_name,
            embeddings=vectors
        )
    except Exception as e:
        logger.error(f"Lỗi khi batch embed với BKAI Bi-Encoder: {e}")
        raise HTTPException(status_code=500, detail=f"BKAI Batch Embedding failed: {str(e)}")

@router.get("/info", summary="Lấy thông tin mô hình BKAI Bi-Encoder")
def get_info(model: BkaiBiEncoderModel = Depends(get_bkai_model)):
    return {
        "model_name": model.model_name,
        "dimension": settings.BKAI_VECTOR_DIMENSION,
        "device": model.device,
        "initialized": model._initialized,
    }
