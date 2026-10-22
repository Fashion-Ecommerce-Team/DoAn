import json
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, List
from app.models.schemas import (
    SyncCatalogRequest,
    ImageSearchRequest,
    HybridSearchRequest,
    TextSearchRequest,
    SearchResponse,
    SearchResultItem
)
from app.services.fashion_clip_service import get_engine

app = FastAPI(
    title="Fashion E-Commerce AI Service",
    description="Multimodal Fashion Search & Recommendation Engine using Fashion-CLIP",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    # Warm up FashionCLIP model on startup
    get_engine()

@app.get("/health")
def health_check():
    engine = get_engine()
    return {
        "status": "UP",
        "service": "fashion-clip-ai-service",
        "model": "patrickjohncyh/fashion-clip",
        "device": engine.device,
        "indexed_products": len(engine.product_vectors)
    }

@app.post("/api/v1/ai/sync-catalog")
def sync_catalog(request: SyncCatalogRequest):
    engine = get_engine()
    total = engine.sync_catalog(request.products)
    return {
        "success": True,
        "message": f"Đồng bộ thành công {len(request.products)} sản phẩm vào Fashion-CLIP index!",
        "indexed_total": total
    }

@app.post("/api/v1/ai/search/image", response_model=SearchResponse)
async def search_by_image(
    file: Optional[UploadFile] = File(None),
    imageUrl: Optional[str] = Form(None),
    candidateIds: Optional[str] = Form(None),
    topK: int = Form(20)
):
    engine = get_engine()
    image = None

    if file is not None and file.filename:
        data = await file.read()
        image = engine.load_image_from_bytes(data)
    elif imageUrl and imageUrl.strip():
        try:
            image = engine.load_image_from_url(imageUrl.strip())
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Không thể tải ảnh từ URL: {str(e)}")
    else:
        raise HTTPException(status_code=400, detail="Vui lòng cung cấp file ảnh tải lên hoặc imageUrl!")

    parsed_candidates = None
    if candidateIds:
        try:
            parsed_candidates = [int(x.strip()) for x in candidateIds.split(",") if x.strip()]
        except Exception:
            pass

    results = engine.search_by_image(image, candidate_ids=parsed_candidates, top_k=topK)
    return SearchResponse(
        success=True,
        message="Tìm kiếm sản phẩm theo hình ảnh thành công!",
        total=len(results),
        results=results
    )

@app.post("/api/v1/ai/search/hybrid", response_model=SearchResponse)
async def search_hybrid(
    file: Optional[UploadFile] = File(None),
    imageUrl: Optional[str] = Form(None),
    keyword: Optional[str] = Form(None),
    imageWeight: float = Form(0.6),
    candidateIds: Optional[str] = Form(None),
    topK: int = Form(20)
):
    engine = get_engine()
    image = None

    if file is not None and file.filename:
        data = await file.read()
        image = engine.load_image_from_bytes(data)
    elif imageUrl and imageUrl.strip():
        try:
            image = engine.load_image_from_url(imageUrl.strip())
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Không thể tải ảnh từ URL: {str(e)}")

    if image is None and (not keyword or not keyword.strip()):
        raise HTTPException(status_code=400, detail="Vui lòng cung cấp ít nhất hình ảnh hoặc từ khóa văn bản!")

    parsed_candidates = None
    if candidateIds:
        try:
            parsed_candidates = [int(x.strip()) for x in candidateIds.split(",") if x.strip()]
        except Exception:
            pass

    results = engine.search_hybrid(
        image=image,
        text=keyword,
        image_weight=imageWeight,
        candidate_ids=parsed_candidates,
        top_k=topK
    )
    return SearchResponse(
        success=True,
        message="Tìm kiếm sản phẩm đa phương thức (Hybrid) thành công!",
        total=len(results),
        results=results
    )

@app.post("/api/v1/ai/search/text", response_model=SearchResponse)
def search_by_text(request: TextSearchRequest):
    engine = get_engine()
    results = engine.search_by_text(request.keyword, candidate_ids=request.candidateIds, top_k=request.topK)
    return SearchResponse(
        success=True,
        message="Tìm kiếm ngữ nghĩa đa phương thức theo văn bản thành công!",
        total=len(results),
        results=results
    )
