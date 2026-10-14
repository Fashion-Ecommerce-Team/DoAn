package ecommerce.common.constant;

import lombok.Getter;

@Getter
public enum CouponStatus {
    ACTIVE("Hoạt động"),
    INACTIVE("Tạm dừng"),
    EXPIRED("Hết hạn"),
    DELETED("Đã xóa");

    private final String description;

    CouponStatus(String description) {
        this.description = description;
    }

    /**
     * Kiểm tra xem mã có thể đổi trạng thái thủ công hay không
     * Mã đã xóa hoặc đã hết hạn không cho phép đổi trạng thái
     */
    public boolean canChangeStatus() {
        return this == ACTIVE || this == INACTIVE;
    }

    public static CouponStatus fromString(String statusStr) {
        if (statusStr == null || statusStr.trim().isEmpty()) {
            return ACTIVE;
        }
        for (CouponStatus s : values()) {
            if (s.name().equalsIgnoreCase(statusStr.trim())) {
                return s;
            }
        }
        return ACTIVE;
    }
}
