package ecommerce.common.constant;

import lombok.Getter;

@Getter
public enum OrderStatus {
    PENDING,
    CONFIRMED,
    SHIPPED,
    COMPLETED,
    CANCELLED;

    public boolean canCancel() {
        return this == PENDING || this == CONFIRMED;
    }

    /**
     * Chuyển đổi an toàn từ chuỗi String sang OrderStatus (hỗ trợ không phân biệt
     * hoa thường)
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
