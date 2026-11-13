import torch
import torch.nn.functional as F
from transformers import AutoTokenizer, AutoModel
from typing import List, Optional

from app.core.config import settings
from app.core.logging import logger

class BkaiBiEncoderModel:
    """Quản lý nạp mô hình BKAI Vietnamese Bi-Encoder và sinh vector embedding 768 chiều chuẩn hóa L2."""

    def __init__(self, model_name: Optional[str] = None):
        self.model_name = model_name or settings.BKAI_MODEL_NAME
        if settings.DEVICE == "auto":
            self.device = "cuda" if torch.cuda.is_available() else "cpu"
        else:
            self.device = settings.DEVICE
        self._tokenizer = None
        self._model = None
        self._initialized = False

    def _load_model(self):
        if not self._initialized:
            logger.info(f"Đang nạp mô hình BKAI Bi-Encoder: {self.model_name}...")
            self._tokenizer = AutoTokenizer.from_pretrained(self.model_name)
            self._model = AutoModel.from_pretrained(self.model_name).to(self.device)
            self._model.eval()
            self._initialized = True
            logger.info(f"BKAI Bi-Encoder đã sẵn sàng trên thiết bị: {self.device}")

    @staticmethod
    def mean_pooling(model_output, attention_mask):
        token_embeddings = model_output[0]  # First element contains all token embeddings
        input_mask_expanded = attention_mask.unsqueeze(-1).expand(token_embeddings.size()).float()
        return torch.sum(token_embeddings * input_mask_expanded, 1) / torch.clamp(input_mask_expanded.sum(1), min=1e-9)

    def embed_text(self, text: str) -> List[float]:
        self._load_model()
        cleaned_text = text.strip() if text else ""
        if not cleaned_text:
            return [0.0] * settings.BKAI_VECTOR_DIMENSION

        encoded_input = self._tokenizer(
            [cleaned_text],
            padding=True,
            truncation=True,
            max_length=256,
            return_tensors='pt'
        ).to(self.device)

        with torch.no_grad():
            model_output = self._model(**encoded_input)

        sentence_embeddings = self.mean_pooling(model_output, encoded_input['attention_mask'])
        sentence_embeddings = F.normalize(sentence_embeddings, p=2, dim=1)
        return sentence_embeddings[0].cpu().tolist()

    def embed_texts(self, texts: List[str]) -> List[List[float]]:
        self._load_model()
        if not texts:
            return []

        cleaned_texts = [t.strip() if t else " " for t in texts]
        encoded_input = self._tokenizer(
            cleaned_texts,
            padding=True,
            truncation=True,
            max_length=256,
            return_tensors='pt'
        ).to(self.device)

        with torch.no_grad():
            model_output = self._model(**encoded_input)

        sentence_embeddings = self.mean_pooling(model_output, encoded_input['attention_mask'])
        sentence_embeddings = F.normalize(sentence_embeddings, p=2, dim=1)
        return sentence_embeddings.cpu().tolist()

_bkai_instance: Optional[BkaiBiEncoderModel] = None

def get_bkai_model() -> BkaiBiEncoderModel:
    global _bkai_instance
    if _bkai_instance is None:
        _bkai_instance = BkaiBiEncoderModel()
    return _bkai_instance
