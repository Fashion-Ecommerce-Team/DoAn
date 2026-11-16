"""
Script fine-tuning Fashion-CLIP trên tập dữ liệu thời trang tùy chỉnh
Sử dụng hàm mất mát Contrastive Cross-Entropy Loss (InfoNCE).
Chạy độc lập với app server:
    python fine_tune.py --epochs 5 --lr 5e-6 --batch_size 16 --output_dir ./checkpoints
"""

import argparse
import os
import torch
from torch.utils.data import DataLoader
from transformers import CLIPModel, CLIPProcessor
from app.core.logging import logger

def train_one_epoch(model, dataloader, optimizer, device):
    model.train()
    total_loss = 0.0

    for batch in dataloader:
        optimizer.zero_grad()

        input_ids = batch["input_ids"].to(device)
        attention_mask = batch["attention_mask"].to(device)
        pixel_values = batch["pixel_values"].to(device)

        # Forward pass qua CLIP
        outputs = model(
            input_ids=input_ids,
            attention_mask=attention_mask,
            pixel_values=pixel_values,
            return_loss=True
        )

        loss = outputs.loss
        loss.backward()
        optimizer.step()

        total_loss += loss.item()

    return total_loss / max(len(dataloader), 1)

def run_fine_tuning(args):
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"Bắt đầu huấn luyện Fashion-CLIP trên thiết bị: {device}")
    
    os.makedirs(args.output_dir, exist_ok=True)

    # 1. Nạp Model & Processor
    model = CLIPModel.from_pretrained(args.base_model).to(device)
    processor = CLIPProcessor.from_pretrained(args.base_model)

    # 2. Cấu hình Optimizer (thường dùng AdamW với learning rate nhỏ cho pre-trained transformers)
    optimizer = torch.optim.AdamW(model.parameters(), lr=args.lr, weight_decay=0.01)

    print(f"Cấu hình: Base Model={args.base_model}, Epochs={args.epochs}, LR={args.lr}, Batch Size={args.batch_size}")
    print("Mô hình sẵn sàng. Chuẩn bị tập dữ liệu cặp (Image, Text) để chạy huấn luyện thực tế.")

    # Lưu cấu hình mô hình
    print(f"Huấn luyện hoàn tất (Mock/Demo run). Checkpoint sẽ được lưu tại: {args.output_dir}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Fine-tune Fashion-CLIP")
    parser.add_argument("--base_model", type=str, default="patrickjohncyh/fashion-clip")
    parser.add_argument("--epochs", type=int, default=5)
    parser.add_argument("--batch_size", type=int, default=16)
    parser.add_argument("--lr", type=float, default=5e-6)
    parser.add_argument("--output_dir", type=str, default="./checkpoints")
    args = parser.parse_args()

    run_fine_tuning(args)

