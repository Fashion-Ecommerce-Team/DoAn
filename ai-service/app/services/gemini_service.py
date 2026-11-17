
import os
import re
import requests

from dotenv import load_dotenv
from google import genai
import time
from google.genai.errors import ServerError
load_dotenv()

API_KEY = os.getenv("GEMINI_API_KEY")
SPRING_BOOT_URL = os.getenv(
    "SPRING_BOOT_URL",
    "http://localhost:8080"
).rstrip("/")

client = genai.Client(api_key=API_KEY) if API_KEY else None


def retrieve_products(message: str) -> list[dict]:
    """
    R - Retrieval:
    Lấy dữ liệu sản phẩm thật từ Spring Boot,
    sau đó lọc những sản phẩm có liên quan đến câu hỏi.
    """
    url = f"{SPRING_BOOT_URL}/internal/ai/rag/products"

    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        products = response.json()
    except requests.RequestException as e:
        raise RuntimeError(
            f"Không thể lấy dữ liệu sản phẩm từ Spring Boot: {e}"
        ) from e

    if not isinstance(products, list):
        raise RuntimeError("API catalog không trả về danh sách sản phẩm hợp lệ.")

    question = message.lower()
    stop_words = {
        "tôi", "muốn", "cần", "tìm", "cho", "một", "những",
        "các", "có", "nào", "là", "và", "với", "giúp",
        "hãy", "bạn", "dưới", "trên", "giá", "bao", "nhiêu",
        "không", "shop", "sản", "phẩm", "đồng", "mua"
    }

    keywords = {
        word for word in re.findall(r"\w+", question)
        if len(word) > 1 and word not in stop_words
    }

    # Tìm mức giá nếu khách hàng đề cập, ví dụ 300.000 hoặc 300000.
    price_match = re.search(
        r"(?:dưới|thấp hơn|ít hơn|không quá)\s*"
        r"(\d[\d.,]*)\s*(k|nghìn|ngàn|triệu)?",
        question
    )

    max_price = None
    if price_match:
        number_text = price_match.group(1).replace(".", "").replace(",", "")
        max_price = int(number_text)

        unit = price_match.group(2)
        if unit == "k" or unit in ("nghìn", "ngàn"):
            max_price *= 1000
        elif unit == "triệu":
            max_price *= 1_000_000

    scored_products = []

    for product in products:
        # API Spring Boot đã lọc sản phẩm ACTIVE và chưa bị xóa.
        searchable_text = " ".join([
            str(product.get("name") or ""),
            str(product.get("description") or ""),
            str(product.get("categoryName") or ""),
            str(product.get("brandName") or ""),
            str(product.get("gender") or ""),
        ]).lower()

        score = sum(
            1 for keyword in keywords
            if keyword in searchable_text
        )

        current_price = product.get("currentPrice")

        # Nếu khách đặt giới hạn giá, chỉ lấy sản phẩm có giá xác định
        # và không vượt quá mức giá đó.
        if max_price is not None:
            if current_price is None or float(current_price) > max_price:
                continue

            score += 2

        # Nếu không có từ khóa cụ thể, vẫn có thể tư vấn từ catalog.
        scored_products.append((score, product))

    scored_products.sort(key=lambda item: item[0], reverse=True)

    # Giới hạn context để không gửi toàn bộ catalog vào Gemini.
    return [
        product
        for score, product in scored_products[:5]
        if score > 0
    ]


def build_product_context(products: list[dict]) -> str:
    """
    A - Augmentation:
    Chuyển dữ liệu được truy xuất thành context cho Gemini.
    """
    if not products:
        return "Không tìm thấy sản phẩm phù hợp trong dữ liệu truy xuất."

    context = []

    for product in products:
        variants = product.get("variants") or []

        variant_lines = []
        for variant in variants:
            variant_lines.append(
                f"- Size: {variant.get('size') or 'Chưa có thông tin'}; "
                f"Màu: {variant.get('color') or 'Chưa có thông tin'}; "
                f"Tồn kho: {variant.get('stockQuantity', 'Chưa có thông tin')}"
            )

        context.append(
            f"""
Tên sản phẩm: {product.get('name', 'Chưa có thông tin')}
Mô tả: {product.get('description') or 'Chưa có mô tả'}
Danh mục: {product.get('categoryName') or 'Chưa có thông tin'}
Thương hiệu: {product.get('brandName') or 'Chưa có thông tin'}
Giới tính: {product.get('gender') or 'Chưa có thông tin'}
Giá gốc: {product.get('basePrice', 'Chưa có thông tin')} VND
Giá hiện tại: {product.get('currentPrice', 'Chưa có thông tin')} VND
Các biến thể:
{chr(10).join(variant_lines) or 'Chưa có thông tin biến thể'}
""".strip()
        )

    return "\n\n".join(context)


def chat_with_gemini(message: str) -> str:
    if client is None:
        raise RuntimeError(
            "Chưa cấu hình GEMINI_API_KEY trong file .env"
        )

    # R - Retrieval
    start = time.perf_counter()
    products = retrieve_products(message)
    print(f"[RAG] Số sản phẩm truy xuất được: {len(products)}")
    print(
        f"[TIME] Retrieval: "
        f"{time.perf_counter() - start:.2f}s"
)
    # A - Augmentation
    start = time.perf_counter()
    context = build_product_context(products)
    print(f"[RAG] Độ dài context: {len(context)} ký tự")
    print(
    f"[TIME] Augmentation: "
    f"{time.perf_counter() - start:.2f}s"
)
    # G - Generation
    start = time.perf_counter()
    prompt = f"""
Bạn là chatbot tư vấn thời trang của website thương mại điện tử.

Hãy trả lời bằng tiếng Việt, thân thiện, dễ hiểu và tự nhiên.

CÂU HỎI KHÁCH HÀNG:
{message}

DỮ LIỆU SẢN PHẨM ĐƯỢC TRUY XUẤT TỪ WEBSITE:
{context}

QUY TẮC:
1. Ưu tiên sử dụng dữ liệu sản phẩm được cung cấp ở trên.
2. Không tự bịa tên sản phẩm, thương hiệu, giá, màu sắc, size hoặc tồn kho.
3. Nếu không tìm thấy sản phẩm phù hợp, hãy nói rõ và đề nghị khách
   thử từ khóa hoặc mức giá khác.
4. Nếu khách hỏi tư vấn phối đồ, có thể đưa lời khuyên thời trang tổng quát.
5. Không khẳng định sản phẩm còn hàng nếu dữ liệu không cho biết điều đó.
6. Trả lời ngắn gọn, dễ đọc; nếu phù hợp, liệt kê tên và giá sản phẩm.
"""

    response = None

    for attempt in range(3):
        try:
            response = client.models.generate_content(
            model="gemini-3.5-flash-lite",
            contents=prompt
            )
            break

        except ServerError as e:
         print(f"[Gemini] Lần thử {attempt + 1}/3 thất bại: {e}")

        if attempt == 2:
            raise

        time.sleep(2 ** (attempt + 1))

    if not response.text:
        raise RuntimeError("Gemini không trả về nội dung.")

    return response.text
