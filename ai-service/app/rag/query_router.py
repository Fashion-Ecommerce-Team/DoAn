
import re
import unicodedata
from enum import Enum


class QueryType(str, Enum):
    PRODUCT = "PRODUCT"
    POLICY = "POLICY"
    HYBRID = "HYBRID"


PRODUCT_KEYWORDS = [
    "tim ao",
    "tim quan",
    "tim vay",
    "tim san pham",
    "goi y san pham",
    "tu van san pham",
    "mua ao",
    "mua quan",
    "mua vay",
    "ao thun",
    "ao khoac",
    "quan jean",
    "quan jeans",
    "vay",
    "dam",
    "phoi do",
    "mac di hoc",
    "mac di lam",
    "size m",
    "size l",
    "con hang",
    "ton kho",
    "gia bao nhieu",
    "duoi 300",
    "duoi 500",
]

POLICY_KEYWORDS = [
    "chinh sach",
    "doi tra",
    "doi size",
    "tra hang",
    "hoan tien",
    "bao hanh",
    "giao hang",
    "van chuyen",
    "phi ship",
    "mien phi ship",
    "ship",
    "cod",
    "vietqr",
    "thanh toan",
    "huy don",
    "doi dia chi",
    "bao nhieu ngay",
    "da giat",
    "loi san pham",
    "giao sai",
]


def normalize_text(text: str) -> str:
    """
    Chuẩn hóa tiếng Việt:
    - Chuyển về chữ thường
    - Loại dấu
    - Chuẩn hóa khoảng trắng
    """
    text = text.lower().replace("đ", "d")

    text = unicodedata.normalize("NFD", text)

    text = "".join(
        char
        for char in text
        if unicodedata.category(char) != "Mn"
    )

    text = re.sub(r"\s+", " ", text)

    return text.strip()


def contains_keyword(text: str, keywords: list[str]) -> bool:
    """
    Kiểm tra cụm từ với ranh giới từ,
    tránh khớp một phần của từ khác.
    """
    for keyword in keywords:
        pattern = (
            r"(?<!\w)"
            + re.escape(keyword)
            + r"(?!\w)"
        )

        if re.search(pattern, text):
            return True

    return False


def classify_query(message: str) -> QueryType:
    """
    Phân loại câu hỏi trước khi Retrieval.
    """
    text = normalize_text(message)

    has_product = contains_keyword(
        text,
        PRODUCT_KEYWORDS
    )

    has_policy = contains_keyword(
        text,
        POLICY_KEYWORDS
    )

    if has_product and has_policy:
        return QueryType.HYBRID

    if has_product:
        return QueryType.PRODUCT

    if has_policy:
        return QueryType.POLICY

    # Câu hỏi không rõ ràng:
    # truy xuất cả hai nguồn để tránh bỏ sót.
    return QueryType.HYBRID
