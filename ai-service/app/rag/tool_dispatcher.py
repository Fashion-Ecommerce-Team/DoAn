
from typing import Any

from app.rag.tools.product_tools import search_products
from app.rag.tools.policy_tools import search_policies
from app.rag.tools.order_tools import (
    get_my_orders,
    get_order_details,
    get_order_status,
)


def dispatch_tool(
    function_name: str,
    arguments: dict[str, Any] | None = None,
    access_token: str | None = None
) -> dict:
    """
    Thực thi function Gemini yêu cầu.

    access_token đến từ HTTP request,
    không đến từ arguments của Gemini.
    """

    arguments = arguments or {}

    if function_name == "search_products":
        query = arguments.get("query")

        if not isinstance(query, str) or not query.strip():
            return {
                "success": False,
                "message": "Thiếu nội dung tìm kiếm sản phẩm."
            }

        return search_products(query=query.strip())

    if function_name == "search_policies":
        query = arguments.get("query")

        if not isinstance(query, str) or not query.strip():
            return {
                "success": False,
                "message": "Thiếu câu hỏi về chính sách."
            }

        return search_policies(query=query.strip())

    if function_name == "get_my_orders":
        return get_my_orders(access_token=access_token)

    if function_name in {
        "get_order_details",
        "get_order_status"
    }:
        order_id = arguments.get("order_id")

        if (
            not isinstance(order_id, int)
            or isinstance(order_id, bool)
            or order_id <= 0
        ):
            return {
                "success": False,
                "message": "Mã đơn hàng không hợp lệ."
            }

        if function_name == "get_order_details":
            return get_order_details(
                order_id=order_id,
                access_token=access_token
            )

        return get_order_status(
            order_id=order_id,
            access_token=access_token
        )

    return {
        "success": False,
        "message": f"Function không được hỗ trợ: {function_name}"
    }
