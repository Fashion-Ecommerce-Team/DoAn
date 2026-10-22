from pydantic import BaseModel, Field
from typing import List, Optional

class ProductItem(BaseModel):
    id: int
    name: str
    imageUrl: Optional[str] = None
    category: Optional[str] = None
    brand: Optional[str] = None

class SyncCatalogRequest(BaseModel):
    products: List[ProductItem]

class ImageSearchRequest(BaseModel):
    imageUrl: Optional[str] = None
    candidateIds: Optional[List[int]] = None
    topK: int = Field(default=20, ge=1, le=100)

class HybridSearchRequest(BaseModel):
    keyword: Optional[str] = None
    imageUrl: Optional[str] = None
    imageWeight: float = Field(default=0.6, ge=0.0, le=1.0)
    candidateIds: Optional[List[int]] = None
    topK: int = Field(default=20, ge=1, le=100)

class TextSearchRequest(BaseModel):
    keyword: str
    candidateIds: Optional[List[int]] = None
    topK: int = Field(default=20, ge=1, le=100)

class SearchResultItem(BaseModel):
    productId: int
    similarity: float

class SearchResponse(BaseModel):
    success: bool
    message: str
    total: int
    results: List[SearchResultItem]
