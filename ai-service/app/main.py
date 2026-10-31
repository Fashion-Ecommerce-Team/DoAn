from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings
from app.core.logging import logger
from app.core.exceptions import (
    AIServiceException,
    ai_service_exception_handler,
    global_exception_handler,
)
from app.fashionclip.router import router as fashionclip_router
from app.fashionclip.model import get_fashion_clip_model

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Khởi động và warm-up mô hình Fashion-CLIP trên GPU/CPU
    logger.info("Khởi động AI Service... Đang làm nóng mô hình Fashion-CLIP.")
    get_fashion_clip_model()
    yield
    logger.info("AI Service đang tắt và giải phóng tài nguyên.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Multimodal Fashion Search & Embedding Engine using Fashion-CLIP",
    version=settings.VERSION,
    lifespan=lifespan,
)

# 1. Cấu hình CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. Đăng ký xử lý lỗi toàn cục
app.add_exception_handler(AIServiceException, ai_service_exception_handler)
app.add_exception_handler(Exception, global_exception_handler)

# 3. Gắn Router Fashion-CLIP (Endpoints chính và Alias tương thích với Spring Boot Backend)
app.include_router(fashionclip_router, prefix="/api/v1/fashionclip", tags=["Fashion-CLIP"])
app.include_router(fashionclip_router, prefix="/api/v1/ai", tags=["Legacy Backend Compatibility"])

# 4. Health Check Endpoints
@app.get("/health", tags=["Health"])
def health_check():
    model = get_fashion_clip_model()
    return {
        "status": "UP",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "model": model.model_name,
        "dimension": settings.VECTOR_DIMENSION,
        "device": model.device,
        "indexed_products": len(model.product_vectors),
    }

@app.get("/", tags=["Root"])
def root():
    return {
        "message": f"{settings.PROJECT_NAME} đang hoạt động!",
        "docs_url": "/docs",
        "module": "fashionclip",
    }
