package ecommerce.cart.dto;

import java.time.LocalDateTime;

public class CartItemResponse {

    private Long id;
    private Long productVariantId;
    private Integer quantity;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public CartItemResponse() {
    }

    public CartItemResponse(
            Long id,
            Long productVariantId,
            Integer quantity,
            LocalDateTime createdAt,
            LocalDateTime updatedAt
    ) {
        this.id = id;
        this.productVariantId = productVariantId;
        this.quantity = quantity;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public Long getId() {
        return id;
    }

    public Long getProductVariantId() {
        return productVariantId;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}