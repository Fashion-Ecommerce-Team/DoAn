from pydantic import BaseModel, Field
from typing import List

class TextEmbeddingRequest(BaseModel):
    text: str = Field(..., description="Văn bản cần sinh vector embedding bằng BKAI Bi-Encoder")

class BatchTextEmbeddingRequest(BaseModel):
    texts: List[str] = Field(..., description="Danh sách các đoạn văn bản cần sinh vector embedding")

class TextEmbeddingResponse(BaseModel):
    success: bool = True
    dimension: int = 768
    model: str = "bkai-foundation-models/vietnamese-bi-encoder"
    embedding: List[float]

class BatchTextEmbeddingResponse(BaseModel):
    success: bool = True
    dimension: int = 768
    count: int
    model: str = "bkai-foundation-models/vietnamese-bi-encoder"
    embeddings: List[List[float]]
