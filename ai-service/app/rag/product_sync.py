import os
import requests

from dotenv import load_dotenv
from qdrant_client import models

from app.rag.embedding import embed_text, product_to_text
from app.rag.vector_store import upsert_products

load_dotenv()

SPRING_BOOT_URL = os.getenv(
    "SPRING_BOOT_URL",
    "http://localhost:8080"
).rstrip("/")


def fetch_products():
    response = requests.get(
        f"{SPRING_BOOT_URL}/internal/ai/rag/products",
        timeout=30
    )
    response.raise_for_status()

    products = response.json()

    if not isinstance(products, list):
        raise RuntimeError(
            "Spring Boot không trả về danh sách sản phẩm."
        )

    return products


def sync_products():
    products = fetch_products()
    points = []

    for product in products:
        product_id = product.get("id")

        if product_id is None:
            continue

        text = product_to_text(product)
        vector = embed_text(text)

        payload = {
            **product,
            "product_id": int(product_id),
            "search_text": text,
            "price": (
                float(product["currentPrice"])
                if product.get("currentPrice") is not None
                else None
            ),
            "in_stock": any(
                (v.get("stockQuantity") or 0) > 0
                for v in product.get("variants") or []
            )
        }

        points.append(
            models.PointStruct(
                id=int(product_id),
                vector=vector,
                payload=payload
            )
        )

        if len(points) >= 32:
            upsert_products(points)
            points.clear()

    if points:
        upsert_products(points)

    return len(products)