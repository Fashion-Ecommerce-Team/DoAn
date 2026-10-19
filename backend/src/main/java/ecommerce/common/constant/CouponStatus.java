package ecommerce.common.constant;

import lombok.Getter;

@Getter
public enum CouponStatus {
    ACTIVE,
    INACTIVE,
    EXPIRED,
    DELETED;

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
