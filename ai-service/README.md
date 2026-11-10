# Fashion-CLIP AI Service (Multimodal Fashion Search & Embeddings)

Dịch vụ AI phục vụ bài toán trích xuất đặc trưng đa phương thức (Multimodal Embeddings) và tìm kiếm sản phẩm tương tự bằng hình ảnh / từ khóa sử dụng mô hình **Fashion-CLIP**.

---

## 1. Cấu trúc thư mục dự án

```text
ai-service/
├── app/
│   ├── main.py                  # Khởi tạo FastAPI app, cấu hình CORS, xử lý lỗi, gắn router
│   ├── core/                    # Dùng chung: config, logging, xử lý lỗi toàn cục
│   │   ├── __init__.py
│   │   ├── config.py            # Quản lý cấu hình bằng Pydantic BaseSettings
│   │   ├── logging.py           # Logger hệ thống
│   │   └── exceptions.py        # Exception handler toàn cục
│   └── fashionclip/             # Phân hệ Fashion-CLIP (Trích xuất đặc trưng & Tìm kiếm ảnh)
│       ├── __init__.py
│       ├── router.py            # /embed/text, /embed/image, /embed/image-url, /search/...
│       ├── model.py             # Nạp model HuggingFace, sinh vector 512d, tính Cosine Similarity
│       └── schemas.py           # Pydantic Request & Response DTOs
├── training/
│   └── fashionclip/             # Scripts tuning và đánh giá độc lập (không chạy cùng web app)
│       ├── evaluate.py          # Đánh giá chỉ số Recall@1, Recall@5, Recall@10, MRR
│       ├── fine_tune.py         # Script huấn luyện với Contrastive Loss (InfoNCE)
│       └── dataset.py           # PyTorch Dataset loader cho các cặp (Image, Text)
├── tests/
│   └── fashionclip/             # Unit tests cho Fashion-CLIP (kiểm tra vector 512d & tìm kiếm)
│       └── test_fashionclip.py
├── requirements.txt             # Danh sách thư viện phụ thuộc
├── run.py                       # File tiện ích chạy server Uvicorn (Port 8001)
└── README.md                    # Hướng dẫn chi tiết
```

---

## 2. Cài đặt môi trường

Khuyến nghị sử dụng Python 3.10+:

```bash
cd ai-service

# Tạo và kích hoạt môi trường ảo (tùy chọn)
python -m venv venv
# Trên Windows:
venv\Scripts\activate
# Trên Linux/macOS:
source venv/bin/activate

# Cài đặt thư viện phụ thuộc
pip install -r requirements.txt
```

---

## 3. Khởi chạy AI Service

```bash
# Cách 1: Sử dụng run.py
python run.py

# Cách 2: Sử dụng lệnh uvicorn trực tiếp
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

* Swagger UI tài liệu API: `http://localhost:8001/docs`
* Health Check: `http://localhost:8001/health`

---

## 4. Danh sách các API chính (`/api/v1/fashionclip`)

### A. Nhóm API trích xuất Vector Embedding 512 chiều:
1. **`POST /api/v1/fashionclip/embed/text`**: 
   * Input: `{"text": "Áo thun oversize streetwear màu đen"}`
   * Output: Vector 512 chiều (`float32`), đã chuẩn hóa L2.
2. **`POST /api/v1/fashionclip/embed/image`**: 
   * Input: File hình ảnh tải lên (`multipart/form-data`).
   * Output: Vector 512 chiều (`float32`), đã chuẩn hóa L2.
3. **`POST /api/v1/fashionclip/embed/image-url`**: 
   * Input: `{"imageUrl": "https://..."}`
   * Output: Vector 512 chiều (`float32`), đã chuẩn hóa L2.

### B. Nhóm API tìm kiếm sản phẩm:
4. **`POST /api/v1/fashionclip/search/image`**: Tìm kiếm các sản phẩm có độ tương đồng hình ảnh cao nhất.
5. **`POST /api/v1/fashionclip/search/hybrid`**: Tìm kiếm kết hợp cả ảnh và chữ theo trọng số `imageWeight` (mặc định 0.6).
6. **`POST /api/v1/fashionclip/sync-catalog`**: Đồng bộ danh mục sản phẩm từ backend Spring Boot vào kho vector in-memory và cache `.npz`.

*(Ghi chú: Router đồng thời được gắn alias `/api/v1/ai/...` để tương thích hoàn toàn với backend Spring Boot `AiServiceClient.java`)*

---

## 5. Chạy kiểm thử tự động (Unit Tests)

```bash
pytest tests/ -v
```

---

## 6. Huấn luyện & Đánh giá mô hình (Training / Evaluation)

Các script này chạy độc lập trong thư mục `training/fashionclip/`:

* **Đánh giá các chỉ số Recall@1, Recall@5, Recall@10 và MRR:**
  ```bash
  python training/fashionclip/evaluate.py --model_name patrickjohncyh/fashion-clip
  ```

* **Chạy Fine-tuning:**
  ```bash
  python training/fashionclip/fine_tune.py --epochs 5 --lr 5e-6 --batch_size 16 --output_dir ./checkpoints
  ```
