package ecommerce.common.constant;

import lombok.Getter;

@Getter
public enum OrderStatus {
    PENDING("Chờ xử lý"),
    CONFIRMED("Đã xác nhận"),
    SHIPPED("Đang giao hàng"),
    COMPLETED("Hoàn thành"),
    CANCELLED("Đã hủy");

    private final String description;

    OrderStatus(String description) {
        this.description = description;
    }

    /**
     * Kiểm tra xem đơn hàng có thể hủy hay không (chỉ khi đơn chưa giao)
     */
    public boolean canCancel() {
        return this == PENDING || this == CONFIRMED;
    }

    /**
     * Chuyển đổi an toàn từ chuỗi String sang OrderStatus (hỗ trợ không phân biệt hoa thường)
     */
    public static OrderStatus fromString(String statusStr) {
        if (statusStr == null || statusStr.trim().isEmpty()) {
            return null;
        }
        for (OrderStatus status : OrderStatus.values()) {
            if (status.name().equalsIgnoreCase(statusStr.trim())) {
                return status;
            }
        }
        return null;
    }
}
