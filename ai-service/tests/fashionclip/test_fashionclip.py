import io
from PIL import Image
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "UP"
    assert "patrickjohncyh/fashion-clip" in data["model"]

def test_embed_text_endpoint():
    payload = {"text": "Áo khoác bomber thời trang streetwear"}
    response = client.post("/api/v1/fashionclip/embed/text", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["dimension"] == 512
    assert len(data["embedding"]) == 512

def test_embed_image_endpoint():
    # Tạo ảnh trắng 100x100 làm mẫu test
    img = Image.new("RGB", (100, 100), color="blue")
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    buf.seek(0)

    files = {"file": ("test_blue.jpg", buf, "image/jpeg")}
    response = client.post("/api/v1/fashionclip/embed/image", files=files)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["dimension"] == 512
    assert len(data["embedding"]) == 512

