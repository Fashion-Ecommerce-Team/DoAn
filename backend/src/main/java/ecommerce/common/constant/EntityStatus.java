package ecommerce.common.constant;

import lombok.Getter;

@Getter
public enum EntityStatus {
    ACTIVE("Hoạt động"),
    INACTIVE("Tạm khóa"),
    DELETED("Đã xóa");
    private final String description;

    EntityStatus(String description) {
        this.description = description;
    }
}
