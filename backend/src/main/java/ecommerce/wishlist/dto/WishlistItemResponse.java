package ecommerce.wishlist.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import ecommerce.product.entity.Product;
import ecommerce.product.entity.ProductImage;
import ecommerce.product.entity.ProductVariant;
import ecommerce.wishlist.entity.Wishlist;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WishlistItemResponse {

    private Long wishlistId;
    private Long productId;
    private String name;
    private String slug;
    private BigDecimal basePrice;
    private BigDecimal discountPrice;
    private String primaryImageUrl;
    private String categoryName;
    private String brandName;
    private Boolean inStock;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime addedAt;

    public static WishlistItemResponse fromEntity(Wishlist wishlist) {
        if (wishlist == null || wishlist.getProduct() == null) {
            return null;
        }

        Product p = wishlist.getProduct();

        String primaryImg = null;
        if (p.getImages() != null && !p.getImages().isEmpty()) {
            primaryImg = p.getImages().stream()
                    .filter(img -> Boolean.TRUE.equals(img.getIsPrimary()))
                    .map(ProductImage::getImageUrl)
                    .findFirst()
                    .orElse(p.getImages().get(0).getImageUrl());
        }

        boolean inStock = false;
        if (p.getVariants() != null && !p.getVariants().isEmpty()) {
            inStock = p.getVariants().stream()
                    .anyMatch(v -> "ACTIVE".equalsIgnoreCase(v.getStatus()) 
                            && v.getStockQuantity() != null 
                            && v.getStockQuantity() > 0);
        }

        return WishlistItemResponse.builder()
                .wishlistId(wishlist.getId())
                .productId(p.getId())
                .name(p.getName())
                .slug(p.getSlug())
                .basePrice(p.getBasePrice())
                .discountPrice(p.getDiscountPrice())
                .primaryImageUrl(primaryImg)
                .categoryName(p.getCategory() != null ? p.getCategory().getName() : null)
                .brandName(p.getBrand() != null ? p.getBrand().getName() : null)
                .inStock(inStock)
                .addedAt(wishlist.getCreatedAt())
                .build();
    }
}
