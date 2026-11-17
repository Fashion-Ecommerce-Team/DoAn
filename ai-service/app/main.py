
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.logging import logger
from app.core.exceptions import (
    AIServiceException,
    ai_service_exception_handler,
    global_exception_handler,
)

# FashionCLIP
from app.fashionclip.router import router as fashionclip_router
from app.fashionclip.model import get_fashion_clip_model

# BKAI Embedding
from app.bkai.router import router as bkai_router

# Chatbot RAG
from app.rag.router import router as rag_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(
        "Khởi động AI Service... "
        "Đang làm nóng mô hình Fashion-CLIP."
    )

    get_fashion_clip_model()

    yield

    logger.info(
        "AI Service đang tắt và giải phóng tài nguyên."
    )


app = FastAPI(
    title=settings.PROJECT_NAME,
    description=(
        "Multimodal Fashion Search, "
        "BKAI Embedding & RAG Chatbot Service"
    ),
    version=settings.VERSION,
    lifespan=lifespan,
)


# ==========================================
# CORS
# ==========================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==========================================
# EXCEPTION HANDLERS
# ==========================================

app.add_exception_handler(
    AIServiceException,
    ai_service_exception_handler
)

app.add_exception_handler(
    Exception,
    global_exception_handler
)


# ==========================================
# FASHIONCLIP ROUTERS
# ==========================================

app.include_router(
    fashionclip_router,
    prefix="/api/v1/fashionclip",
    tags=["Fashion-CLIP"]
)

app.include_router(
    fashionclip_router,
    prefix="/api/v1/ai",
    tags=["Legacy Backend Compatibility"]
)

app.include_router(
    fashionclip_router,
    tags=["Root Compatibility"]
)


# ==========================================
# BKAI EMBEDDING ROUTERS
# ==========================================

app.include_router(
    bkai_router,
    prefix="/api/v1/bkai",
    tags=["BKAI Policy Embedding"]
)

app.include_router(
    bkai_router,
    prefix="/api/v1/embedding",
    tags=["Text Embedding"]
)


# ==========================================
# RAG CHATBOT ROUTER
# ==========================================

app.include_router(
    rag_router
)


# ==========================================
# HEALTH CHECK
# ==========================================

@app.get("/health", tags=["Health"])
def health_check():
    model = get_fashion_clip_model()

    return {
        "status": "UP",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "fashionclip_model": model.model_name,
        "fashionclip_dimension": settings.VECTOR_DIMENSION,
        "bkai_model": settings.BKAI_MODEL_NAME,
        "bkai_dimension": settings.BKAI_VECTOR_DIMENSION,
        "device": model.device,
        "indexed_products": len(model.product_vectors),
    }


# ==========================================
# ROOT
# ==========================================

@app.get("/", tags=["Root"])
def root():
    return {
        "message": (
            f"{settings.PROJECT_NAME} đang hoạt động!"
        ),
        "docs_url": "/docs",
        "modules": [
            "fashionclip",
            "bkai-bi-encoder",
            "rag-chatbot"
        ],
    }
