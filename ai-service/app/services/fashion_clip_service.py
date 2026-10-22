import io
import os
import requests
import numpy as np
import torch
from PIL import Image
from typing import List, Dict, Optional, Tuple
from transformers import CLIPProcessor, CLIPModel
from app.models.schemas import ProductItem, SearchResultItem

CACHE_FILE = os.path.join(os.path.dirname(__file__), "..", "..", "catalog_embeddings.npz")

class FashionClipEngine:
    def __init__(self, model_name: str = "patrickjohncyh/fashion-clip"):
        print(f"Loading Fashion-CLIP model: {model_name}...")
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.model = CLIPModel.from_pretrained(model_name).to(self.device)
        self.processor = CLIPProcessor.from_pretrained(model_name)
        self.model.eval()
        print(f"Fashion-CLIP loaded successfully on device: {self.device}")

        # In-memory vector store: id -> 512-dim vector
        self.product_vectors: Dict[int, np.ndarray] = {}
        self.product_metadata: Dict[int, ProductItem] = {}
        self._load_cache()

    def _load_cache(self):
        """Load cached embeddings if available"""
        if os.path.exists(CACHE_FILE):
            try:
                data = np.load(CACHE_FILE, allow_pickle=True)
                ids = data["ids"]
                vectors = data["vectors"]
                for pid, vec in zip(ids, vectors):
                    self.product_vectors[int(pid)] = vec
                print(f"Loaded {len(self.product_vectors)} cached product embeddings from {CACHE_FILE}")
            except Exception as e:
                print(f"Failed to load cache: {e}")

    def _save_cache(self):
        """Save embeddings to local cache"""
        try:
            ids = np.array(list(self.product_vectors.keys()))
            vectors = np.array(list(self.product_vectors.values()))
            np.savez_compressed(CACHE_FILE, ids=ids, vectors=vectors)
            print(f"Saved {len(ids)} product embeddings to {CACHE_FILE}")
        except Exception as e:
            print(f"Failed to save cache: {e}")

    def encode_text(self, text: str) -> np.ndarray:
        """Encode text query into normalized 512-dim vector"""
        if not text or not text.strip():
            return np.zeros(512, dtype=np.float32)
        
        inputs = self.processor(text=[text.strip()], return_tensors="pt", padding=True, truncation=True)
        inputs = {k: v.to(self.device) for k, v in inputs.items()}
        with torch.no_grad():
            out = self.model.get_text_features(**inputs)
            feat = out.pooler_output if hasattr(out, "pooler_output") else out
            feat = feat / feat.norm(p=2, dim=-1, keepdim=True)
            return feat.cpu().numpy()[0].astype(np.float32)

    def encode_image(self, image: Image.Image) -> np.ndarray:
        """Encode PIL Image into normalized 512-dim vector"""
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
        """Load image from raw bytes"""
        return Image.open(io.BytesIO(data))

    def load_image_from_url(self, url: str) -> Image.Image:
        """Download image from URL with timeout"""
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
        resp = requests.get(url, headers=headers, timeout=5)
        resp.raise_for_status()
        return Image.open(io.BytesIO(resp.content))

    def sync_catalog(self, products: List[ProductItem]) -> int:
        """Compute embeddings for product catalog"""
        count = 0
        for p in products:
            self.product_metadata[p.id] = p
            # If already cached, skip
            if p.id in self.product_vectors:
                continue

            vector = None
            if p.imageUrl:
                try:
                    img = self.load_image_from_url(p.imageUrl)
                    vector = self.encode_image(img)
                except Exception as e:
                    # Fallback to text embedding of product name + category
                    pass

            if vector is None:
                # Fallback to rich textual description
                desc = f"{p.name} {p.category or ''} {p.brand or ''}".strip()
                vector = self.encode_text(desc)

            self.product_vectors[p.id] = vector
            count += 1

        if count > 0:
            self._save_cache()
        return len(self.product_vectors)

    def search_by_vector(self, query_vector: np.ndarray, candidate_ids: Optional[List[int]] = None, top_k: int = 20) -> List[SearchResultItem]:
        """Compute cosine similarity between query vector and candidate product vectors"""
        if not self.product_vectors:
            return []

        # Filter candidate pool
        if candidate_ids is not None and len(candidate_ids) > 0:
            candidate_set = set(candidate_ids)
            target_ids = [pid for pid in self.product_vectors.keys() if pid in candidate_set]
        else:
            target_ids = list(self.product_vectors.keys())

        if not target_ids:
            return []

        # Matrix dot product (both query and target vectors are L2-normalized)
        mat = np.array([self.product_vectors[pid] for pid in target_ids], dtype=np.float32)
        sims = np.dot(mat, query_vector)

        # Sort descending
        top_indices = np.argsort(-sims)[:top_k]
        results = []
        for idx in top_indices:
            score = float(sims[idx])
            # Normalize score into [0.0, 1.0] range
            score_clamped = max(0.0, min(1.0, (score + 1.0) / 2.0))
            results.append(SearchResultItem(productId=target_ids[idx], similarity=round(score_clamped, 4)))

        return results

    def search_by_image(self, image: Image.Image, candidate_ids: Optional[List[int]] = None, top_k: int = 20) -> List[SearchResultItem]:
        query_vec = self.encode_image(image)
        return self.search_by_vector(query_vec, candidate_ids, top_k)

    def search_by_text(self, text: str, candidate_ids: Optional[List[int]] = None, top_k: int = 20) -> List[SearchResultItem]:
        query_vec = self.encode_text(text)
        return self.search_by_vector(query_vec, candidate_ids, top_k)

    def search_hybrid(self, image: Optional[Image.Image], text: Optional[str], image_weight: float = 0.6, candidate_ids: Optional[List[int]] = None, top_k: int = 20) -> List[SearchResultItem]:
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

# Global singleton
_engine: Optional[FashionClipEngine] = None

def get_engine() -> FashionClipEngine:
    global _engine
    if _engine is None:
        _engine = FashionClipEngine()
    return _engine
