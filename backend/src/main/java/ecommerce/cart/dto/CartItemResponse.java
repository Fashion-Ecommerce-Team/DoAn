
package ecommerce.cart.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CartItemResponse {
    private Long id;
    private Long productVariantId;
    private Integer quantity;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    private Long productId;
    private String productName;
    private String imageUrl;
    private String size;
    private String color;
    private BigDecimal price;
    private Integer stockQuantity;
    public void setId(Long id) {
    this.id = id;
}

public void setProductVariantId(Long productVariantId) {
    this.productVariantId = productVariantId;
}

public void setQuantity(Integer quantity) {
    this.quantity = quantity;
}

public void setCreatedAt(LocalDateTime createdAt) {
    this.createdAt = createdAt;
}

public void setUpdatedAt(LocalDateTime updatedAt) {
    this.updatedAt = updatedAt;
}
public void setProductId(Long productId) {
    this.productId = productId;
}

public void setProductName(String productName) {
    this.productName = productName;
}

public void setImageUrl(String imageUrl) {
    this.imageUrl = imageUrl;
}

public void setSize(String size) {
    this.size = size;
}

public void setColor(String color) {
    this.color = color;
}

public void setPrice(BigDecimal price) {
    this.price = price;
}

public void setStockQuantity(Integer stockQuantity) {
    this.stockQuantity = stockQuantity;
}
}
