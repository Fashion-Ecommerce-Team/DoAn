import os
from PIL import Image
from typing import List, Dict, Tuple
from torch.utils.data import Dataset

class FashionPairDataset(Dataset):
    """Dataset chứa các cặp (Image, Text caption/title) dùng cho training và evaluation."""

    def __init__(self, data: List[Dict[str, str]], processor, image_root: str = ""):
        self.data = data
        self.processor = processor
        self.image_root = image_root

    def __len__(self):
        return len(self.data)

    def __getitem__(self, idx):
        item = self.data[idx]
        image_path = os.path.join(self.image_root, item["image_path"])
        
        # Mở ảnh
        if os.path.exists(image_path):
            image = Image.open(image_path).convert("RGB")
        else:
            # Fallback ảnh giả lập kích thước chuẩn nếu đường dẫn chưa tải
            image = Image.new("RGB", (224, 224), color=(240, 240, 240))

        text = item.get("caption", item.get("title", ""))

        inputs = self.processor(
            text=[text],
            images=image,
            return_tensors="pt",
            padding="max_length",
            truncation=True,
            max_length=64
        )

        return {
            "input_ids": inputs["input_ids"].squeeze(0),
            "attention_mask": inputs["attention_mask"].squeeze(0),
            "pixel_values": inputs["pixel_values"].squeeze(0),
            "target_id": idx,
        }

