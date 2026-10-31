import os
from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    PROJECT_NAME: str = "Fashion E-Commerce AI Service"
    VERSION: str = "2.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Server config
    HOST: str = "0.0.0.0"
    PORT: int = 8001
    CORS_ORIGINS: List[str] = ["*"]
    
    # Fashion-CLIP config
    FASHION_CLIP_MODEL_NAME: str = "patrickjohncyh/fashion-clip"
    VECTOR_DIMENSION: int = 512
    CACHE_FILE: str = os.path.join(os.path.dirname(__file__), "..", "..", "catalog_embeddings.npz")
    
    # Device: auto select cuda if available
    DEVICE: str = "cuda" if os.environ.get("CUDA_VISIBLE_DEVICES") else "auto"

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()

