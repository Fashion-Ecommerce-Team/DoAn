import io
import os
import requests
import numpy as np
import torch
from PIL import Image
from typing import List, Dict, Optional
from transformers import CLIPProcessor, CLIPModel

from app.core.config import settings
from app.core.logging import logger
from app.fashionclip.schemas import ProductItem, SearchResultItem

class FashionClipModel:
    """Quản lý nạp model Fashion-CLIP, sinh vector embedding 512 chiều và tìm kiếm tương đồng."""

    def __init__(self, model_name: Optional[str] = None):
        self.model_name = model_name or settings.FASHION_CLIP_MODEL_NAME
        logger.info(f"Đang nạp mô hình Fashion-CLIP: {self.model_name}...")

        if settings.DEVICE == "auto":
            self.device = "cuda" if torch.cuda.is_available() else "cpu"
        else:
            self.device = settings.DEVICE

        self.model = CLIPModel.from_pretrained(self.model_name).to(self.device)
        self.processor = CLIPProcessor.from_pretrained(self.model_name)
        self.model.eval()
        logger.info(f"Fashion-CLIP đã sẵn sàng trên thiết bị: {self.device}")

        # In-memory vector store: productId -> 512-dim vector float32
        self.product_vectors: Dict[int, np.ndarray] = {}
        self.product_metadata: Dict[int, ProductItem] = {}
        self._load_cache()

    def _load_cache(self):
        """Tải các vector embeddings đã tính toán sẵn từ file cache (.npz)"""
        cache_path = settings.CACHE_FILE
        if os.path.exists(cache_path):
            try:
                data = np.load(cache_path, allow_pickle=True)
                ids = data["ids"]
                vectors = data["vectors"]
                for pid, vec in zip(ids, vectors):
                    self.product_vectors[int(pid)] = vec
                logger.info(f"Đã nạp {len(self.product_vectors)} embeddings sản phẩm từ cache: {cache_path}")
            except Exception as e:
                logger.warning(f"Không thể nạp cache: {e}")

    def _save_cache(self):
        """Lưu trữ vector embeddings xuống file cache (.npz) để khởi động nhanh"""
        try:
            cache_path = settings.CACHE_FILE
            ids = np.array(list(self.product_vectors.keys()))
            vectors = np.array(list(self.product_vectors.values()))
            np.savez_compressed(cache_path, ids=ids, vectors=vectors)
            logger.info(f"Đã lưu cache {len(ids)} vector sản phẩm tại: {cache_path}")
        except Exception as e:
            logger.error(f"Lỗi khi lưu cache vector: {e}")

    def encode_text(self, text: str) -> np.ndarray:
        """Trích xuất vector đặc trưng 512 chiều từ văn bản, đã chuẩn hóa L2."""
        if not text or not text.strip():
            return np.zeros(settings.VECTOR_DIMENSION, dtype=np.float32)

        inputs = self.processor(text=[text.strip()], return_tensors="pt", padding=True, truncation=True)
        inputs = {k: v.to(self.device) for k, v in inputs.items()}
        with torch.no_grad():
            out = self.model.get_text_features(**inputs)
            feat = out.pooler_output if hasattr(out, "pooler_output") else out
            feat = feat / feat.norm(p=2, dim=-1, keepdim=True)
            return feat.cpu().numpy()[0].astype(np.float32)

    def encode_image(self, image: Image.Image) -> np.ndarray:
        """Trích xuất vector đặc trưng 512 chiều từ ảnh PIL, đã chuẩn hóa L2."""
        if image.mode != "RGB":
            image = image.convert("RGB")

        inputs = self.processor(images=image, return_tensors="pt")
        inputs = {k: v.to(self.device) for k, v in inputs.items()}
        with torch.no_grad():
            out = self.model.get_image_features(**inputs)
            feat = out.pooler_output if hasattr(out, "pooler_output") else out
            feat = feat / feat.norm(p=2, dim=-1, keepdim=True)
            return feat.cpu().numpy()[0].astype(np.float32)

    def load_image_from_bytes(self, data: bytes) -> Image.Image:
        """Chuyển đổi dữ liệu nhị phân (bytes) thành đối tượng PIL Image."""
        return Image.open(io.BytesIO(data))

    def load_image_from_url(self, url: str) -> Image.Image:
        """Tải hình ảnh từ đường dẫn URL."""
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
        resp = requests.get(url, headers=headers, timeout=8)
        resp.raise_for_status()
        return Image.open(io.BytesIO(resp.content))

    def sync_catalog(self, products: List[ProductItem]) -> int:
        """Đồng bộ và tính toán vector cho toàn bộ danh mục sản phẩm."""
        count = 0
        for p in products:
            self.product_metadata[p.id] = p
            if p.id in self.product_vectors:
                continue

            vector = None
            if p.imageUrl:
                try:
                    img = self.load_image_from_url(p.imageUrl)
                    vector = self.encode_image(img)
                except Exception as e:
                    logger.warning(f"Lỗi tải ảnh sản phẩm {p.id}: {e}")

            if vector is None:
                desc = f"{p.name} {p.category or ''} {p.brand or ''}".strip()
                vector = self.encode_text(desc)

            self.product_vectors[p.id] = vector
            count += 1

        if count > 0:
            self._save_cache()
        return len(self.product_vectors)

    def search_by_vector(
        self,
        query_vector: np.ndarray,
        candidate_ids: Optional[List[int]] = None,
        top_k: int = 20
    ) -> List[SearchResultItem]:
        """Tính Cosine Similarity giữa query_vector và kho vector sản phẩm."""
        if not self.product_vectors:
            return []

        if candidate_ids is not None and len(candidate_ids) > 0:
            candidate_set = set(candidate_ids)
            target_ids = [pid for pid in self.product_vectors.keys() if pid in candidate_set]
        else:
            target_ids = list(self.product_vectors.keys())

        if not target_ids:
            return []

        mat = np.array([self.product_vectors[pid] for pid in target_ids], dtype=np.float32)
        sims = np.dot(mat, query_vector)

        top_indices = np.argsort(-sims)[:top_k]
        results = []
        for idx in top_indices:
            score = float(sims[idx])
            score_clamped = max(0.0, min(1.0, (score + 1.0) / 2.0))
            results.append(SearchResultItem(productId=target_ids[idx], similarity=round(score_clamped, 4)))

        return results

    def search_by_image(self, image: Image.Image, candidate_ids: Optional[List[int]] = None, top_k: int = 20) -> List[SearchResultItem]:
        query_vec = self.encode_image(image)
        return self.search_by_vector(query_vec, candidate_ids, top_k)

    def search_by_text(self, text: str, candidate_ids: Optional[List[int]] = None, top_k: int = 20) -> List[SearchResultItem]:
        query_vec = self.encode_text(text)
        return self.search_by_vector(query_vec, candidate_ids, top_k)

    def search_hybrid(
        self,
        image: Optional[Image.Image],
        text: Optional[str],
        image_weight: float = 0.6,
        candidate_ids: Optional[List[int]] = None,
        top_k: int = 20
    ) -> List[SearchResultItem]:
        img_vec = self.encode_image(image) if image is not None else None
        txt_vec = self.encode_text(text) if (text and text.strip()) else None

        if img_vec is not None and txt_vec is not None:
            w_img = float(image_weight)
            w_txt = 1.0 - w_img
            hybrid_vec = w_img * img_vec + w_txt * txt_vec
            norm = np.linalg.norm(hybrid_vec)
            if norm > 0:
                hybrid_vec = hybrid_vec / norm
            query_vec = hybrid_vec
        elif img_vec is not None:
            query_vec = img_vec
        elif txt_vec is not None:
            query_vec = txt_vec
        else:
            return []

        return self.search_by_vector(query_vec, candidate_ids, top_k)

# Global Singleton
_fashion_clip_model: Optional[FashionClipModel] = None

def get_fashion_clip_model() -> FashionClipModel:
    global _fashion_clip_model
    if _fashion_clip_model is None:
        _fashion_clip_model = FashionClipModel()
    return _fashion_clip_model

