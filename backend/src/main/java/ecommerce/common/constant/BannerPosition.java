package ecommerce.common.constant;

import lombok.Getter;

@Getter
public enum BannerPosition {
    HERO,
    SIDEBAR,
    FOOTER;

    /**
     * Chuyển đổi an toàn từ String sang BannerPosition (không phân biệt hoa thường)
     */
    public static BannerPosition fromString(String value) {
        if (value == null || value.trim().isEmpty()) {
            return null;
        }
        for (BannerPosition p : values()) {
            if (p.name().equalsIgnoreCase(value.trim())) {
                return p;
            }
        }
        return null;
    }
}
