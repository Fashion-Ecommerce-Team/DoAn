
from google.genai import types

# Các function Gemini được phép lựa chọn.
# Đây chỉ là khai báo, chưa thực thi API.

TOOL_DECLARATIONS = [
    types.FunctionDeclaration(
        name="search_products",
        description=(
            "Tìm sản phẩm thời trang theo tên, mô tả, "
            "màu sắc, kích thước hoặc khoảng giá."
        ),
        parameters={
            "type": "OBJECT",
            "properties": {
                "query": {
                    "type": "STRING",
                    "description": "Yêu cầu tìm kiếm sản phẩm"
                }
            },
            "required": ["query"]
        }
    ),
    types.FunctionDeclaration(
        name="search_policies",
        description=(
            "Tìm thông tin chính sách đổi trả, "
            "bảo hành, giao hàng và thanh toán."
        ),
        parameters={
            "type": "OBJECT",
            "properties": {
                "query": {
                    "type": "STRING",
                    "description": "Câu hỏi về chính sách"
                }
            },
            "required": ["query"]
        }
    ),
    types.FunctionDeclaration(
        name="get_my_orders",
        description="Lấy danh sách đơn hàng của khách hàng đã đăng nhập.",
        parameters={
            "type": "OBJECT",
            "properties": {}
        }
    ),
    types.FunctionDeclaration(
        name="get_order_details",
        description="Lấy chi tiết một đơn hàng của khách hàng.",
        parameters={
            "type": "OBJECT",
            "properties": {
                "order_id": {
                    "type": "INTEGER",
                    "description": "Mã đơn hàng"
                }
            },
            "required": ["order_id"]
        }
    ),
    types.FunctionDeclaration(
        name="get_order_status",
        description="Kiểm tra trạng thái đơn hàng của khách hàng.",
        parameters={
            "type": "OBJECT",
            "properties": {
                "order_id": {
                    "type": "INTEGER",
                    "description": "Mã đơn hàng"
                }
            },
            "required": ["order_id"]
        }
    )
]

GEMINI_TOOLS = [
    types.Tool(function_declarations=TOOL_DECLARATIONS)
]
