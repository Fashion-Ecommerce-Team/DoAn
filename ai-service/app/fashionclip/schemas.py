from pydantic import BaseModel, Field
from typing import List, Optional

# --- 1. Embedding Schemas ---
class TextEmbedRequest(BaseModel):
    text: str = Field(..., description="Văn bản hoặc từ khóa cần mã hóa", example="Áo thun oversize streetwear màu đen")

class TextEmbedResponse(BaseModel):
    success: bool = True
    text: str
    dimension: int = 512
    embedding: List[float]

class ImageUrlEmbedRequest(BaseModel):
    imageUrl: str = Field(..., description="Đường dẫn URL của hình ảnh cần mã hóa")

class ImageEmbedResponse(BaseModel):
    success: bool = True
    dimension: int = 512
    embedding: List[float]

# --- 2. Catalog & Search Schemas (Tương thích với Backend E-commerce) ---
class ProductItem(BaseModel):
    id: int
    name: str
    imageUrl: Optional[str] = None
    category: Optional[str] = None
    brand: Optional[str] = None

class SyncCatalogRequest(BaseModel):
    products: List[ProductItem]

class SyncCatalogResponse(BaseModel):
    success: bool = True
    message: str
    indexed_total: int

class SearchResultItem(BaseModel):
    productId: int
    similarity: float

class SearchResponse(BaseModel):
    success: bool = True
    message: str
    total: int
    results: List[SearchResultItem]

