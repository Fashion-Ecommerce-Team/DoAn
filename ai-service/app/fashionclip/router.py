from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from typing import Optional

from app.fashionclip.schemas import (
    TextEmbedRequest,
    TextEmbedResponse,
    ImageUrlEmbedRequest,
    ImageEmbedResponse,
    SyncCatalogRequest,
    SyncCatalogResponse,
    SearchResponse
)
from app.fashionclip.model import FashionClipModel, get_fashion_clip_model
from app.core.logging import logger

router = APIRouter()

# ==========================================
# 1. EMBEDDING ENDPOINTS (/embed/...)
# ==========================================

@router.post("/embed/text", response_model=TextEmbedResponse, summary="Tạo vector embedding từ văn bản")
async def embed_text(
    request: TextEmbedRequest,
    model: FashionClipModel = Depends(get_fashion_clip_model)
):
    """Trích xuất vector 512 chiều từ chuỗi văn bản hoặc mô tả sản phẩm."""
    if not request.text.strip():
        raise HTTPException(status_code=400, detail="Văn bản không được để trống!")
    
    vec = model.encode_text(request.text)
    return TextEmbedResponse(
        success=True,
        text=request.text,
        dimension=len(vec),
        embedding=vec.tolist()
    )

@router.post("/embed/image", response_model=ImageEmbedResponse, summary="Tạo vector embedding từ file ảnh tải lên")
async def embed_image(
    file: UploadFile = File(..., description="File hình ảnh cần mã hóa"),
    model: FashionClipModel = Depends(get_fashion_clip_model)
):
    """Trích xuất vector 512 chiều từ file hình ảnh tải lên."""
    try:
        content = await file.read()
        image = model.load_image_from_bytes(content)
        vec = model.encode_image(image)
        return ImageEmbedResponse(
            success=True,
            dimension=len(vec),
            embedding=vec.tolist()
        )
    except Exception as e:
        logger.error(f"Lỗi khi mã hóa ảnh: {e}")
        raise HTTPException(status_code=400, detail=f"Không thể xử lý file ảnh: {str(e)}")

@router.post("/embed/image-url", response_model=ImageEmbedResponse, summary="Tạo vector embedding từ đường dẫn ảnh (URL)")
async def embed_image_url(
    request: ImageUrlEmbedRequest,
    model: FashionClipModel = Depends(get_fashion_clip_model)
):
    """Trích xuất vector 512 chiều từ hình ảnh thông qua đường dẫn URL."""
    try:
        image = model.load_image_from_url(request.imageUrl.strip())
        vec = model.encode_image(image)
        return ImageEmbedResponse(
            success=True,
            dimension=len(vec),
            embedding=vec.tolist()
        )
    except Exception as e:
        logger.error(f"Lỗi khi tải ảnh từ URL ({request.imageUrl}): {e}")
        raise HTTPException(status_code=400, detail=f"Không thể tải hình ảnh từ URL: {str(e)}")

# ==========================================
# 2. CATALOG & SEARCH ENDPOINTS (Tương tác với E-Commerce Backend)
# ==========================================

@router.post("/sync-catalog", response_model=SyncCatalogResponse, summary="Đồng bộ danh mục sản phẩm vào kho vector")
def sync_catalog(
    request: SyncCatalogRequest,
    model: FashionClipModel = Depends(get_fashion_clip_model)
):
    total = model.sync_catalog(request.products)
    return SyncCatalogResponse(
        success=True,
        message=f"Đồng bộ thành công {len(request.products)} sản phẩm vào Fashion-CLIP index!",
        indexed_total=total
    )

@router.post("/search/image", response_model=SearchResponse, summary="Tìm kiếm sản phẩm bằng hình ảnh")
async def search_by_image(
    file: Optional[UploadFile] = File(None),
    imageUrl: Optional[str] = Form(None),
    candidateIds: Optional[str] = Form(None),
    topK: int = Form(20),
    model: FashionClipModel = Depends(get_fashion_clip_model)
):
    image = None
    if file is not None and file.filename:
        data = await file.read()
        image = model.load_image_from_bytes(data)
    elif imageUrl and imageUrl.strip():
        try:
            image = model.load_image_from_url(imageUrl.strip())
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

    results = model.search_by_image(image, candidate_ids=parsed_candidates, top_k=topK)
    return SearchResponse(
        success=True,
        message="Tìm kiếm sản phẩm theo hình ảnh thành công!",
        total=len(results),
        results=results
    )

@router.post("/search/hybrid", response_model=SearchResponse, summary="Tìm kiếm sản phẩm đa phương thức (Ảnh + Chữ)")
async def search_hybrid(
    file: Optional[UploadFile] = File(None),
    imageUrl: Optional[str] = Form(None),
    keyword: Optional[str] = Form(None),
    imageWeight: float = Form(0.6),
    candidateIds: Optional[str] = Form(None),
    topK: int = Form(20),
    model: FashionClipModel = Depends(get_fashion_clip_model)
):
    image = None
    if file is not None and file.filename:
        data = await file.read()
        image = model.load_image_from_bytes(data)
    elif imageUrl and imageUrl.strip():
        try:
            image = model.load_image_from_url(imageUrl.strip())
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

    results = model.search_hybrid(
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

