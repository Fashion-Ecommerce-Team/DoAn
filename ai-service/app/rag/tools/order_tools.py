
import os
import requests

from dotenv import load_dotenv

load_dotenv()

BACKEND_URL = os.getenv(
    "SPRING_BOOT_URL",
    "http://localhost:8080"
).rstrip("/")


def _call_order_api(path: str, access_token: str | None) -> dict:
    """
    Gọi API đơn hàng của Spring Boot.
    JWT được truyền từ request đã xác thực,
    không lấy từ tham số do Gemini tạo.
    """

    if not access_token:
        return {
            "success": False,
            "message": "Bạn cần đăng nhập để xem thông tin đơn hàng."
        }

    try:
        response = requests.get(
            f"{BACKEND_URL}{path}",
            headers={
                "Authorization": f"Bearer {access_token}"
            },
            timeout=10
        )

        if response.status_code == 401:
            return {
                "success": False,
                "message": "Phiên đăng nhập đã hết hạn hoặc không hợp lệ."
            }

        if response.status_code == 403:
            return {
                "success": False,
                "message": "Bạn không có quyền xem đơn hàng này."
            }

        if response.status_code == 404:
            return {
                "success": False,
                "message": "Không tìm thấy đơn hàng."
            }

        response.raise_for_status()

        payload = response.json()

        if not isinstance(payload, dict):
            raise ValueError("Phản hồi API không hợp lệ.")

        return payload

    except (requests.RequestException, ValueError) as e:
        print(f"[ORDER TOOL ERROR] {type(e).__name__}: {e}")

        return {
            "success": False,
            "message": "Không thể tra cứu đơn hàng lúc này."
        }


def get_my_orders(access_token: str | None) -> dict:
    return _call_order_api(
        "/api/v1/orders",
        access_token
    )


def get_order_details(
    order_id: int,
    access_token: str | None
) -> dict:
    if not isinstance(order_id, int) or isinstance(order_id, bool) or order_id <= 0:
        return {
            "success": False,
            "message": "Mã đơn hàng không hợp lệ."
        }

    return _call_order_api(
        f"/api/v1/orders/{order_id}",
        access_token
    )


def get_order_status(
    order_id: int,
    access_token: str | None
) -> dict:
    if not isinstance(order_id, int) or isinstance(order_id, bool) or order_id <= 0:
        return {
            "success": False,
            "message": "Mã đơn hàng không hợp lệ."
        }

    return _call_order_api(
        f"/api/v1/orders/{order_id}/status",
        access_token
    )
