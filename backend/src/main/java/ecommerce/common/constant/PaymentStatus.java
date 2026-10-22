package ecommerce.common.constant;

import lombok.Getter;

@Getter
public enum PaymentStatus {
    PENDING,
    PAID,
    FAILED,
    EXPIRED,
    REFUNDED;

    /**
     * Chuyển đổi an toàn từ String sang PaymentStatus (không phân biệt hoa thường)
     */
    public static PaymentStatus fromString(String value) {
        if (value == null || value.trim().isEmpty()) {
            return null;
        }
        for (PaymentStatus s : values()) {
            if (s.name().equalsIgnoreCase(value.trim())) {
                return s;
            }
        }
        return null;
    }
}
