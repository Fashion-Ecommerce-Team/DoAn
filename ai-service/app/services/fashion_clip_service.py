# Proxy tương thích ngược với các script cũ
from app.fashionclip.model import FashionClipModel as FashionClipEngine, get_fashion_clip_model as get_engine

__all__ = ["FashionClipEngine", "get_engine"]
