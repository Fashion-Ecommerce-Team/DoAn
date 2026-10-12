package ecommerce.product.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import ecommerce.brand.dto.BrandResponse;
import ecommerce.category.dto.CategoryResponse;
import ecommerce.product.entity.Product;
import ecommerce.product.entity.ProductImage;
import ecommerce.product.entity.ProductVariant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Objects;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductSummaryResponse {

    private Long id;
    private String name;
    private String slug;
    private BigDecimal basePrice;
    private BigDecimal discountPrice;
    private String gender;
    private String status;
    private CategoryResponse category;
    private BrandResponse brand;
    private String primaryImageUrl;
    private Integer totalStock;
    private List<String> availableSizes;
    private List<String> availableColors;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;

    public static ProductSummaryResponse fromEntity(Product product) {
        if (product == null) {
            return null;
        }

        // 1. Determine primary image
        String primaryImg = null;
        if (product.getImages() != null && !product.getImages().isEmpty()) {
            primaryImg = product.getImages().stream()
                    .filter(img -> Boolean.TRUE.equals(img.getIsPrimary()))
                    .map(ProductImage::getImageUrl)
                    .findFirst()
                    .orElse(product.getImages().get(0).getImageUrl());
        }

        // 2. Aggregate variant info: total stock, available sizes and colors
        int totalStock = 0;
        List<String> sizes = Collections.emptyList();
        List<String> colors = Collections.emptyList();

        if (product.getVariants() != null && !product.getVariants().isEmpty()) {
            totalStock = product.getVariants().stream()
                    .filter(v -> "ACTIVE".equalsIgnoreCase(v.getStatus()))
                    .mapToInt(v -> v.getStockQuantity() != null ? v.getStockQuantity() : 0)
                    .sum();

            sizes = product.getVariants().stream()
                    .map(ProductVariant::getSize)
                    .filter(Objects::nonNull)
                    .filter(s -> !s.isBlank())
                    .distinct()
                    .toList();

            colors = product.getVariants().stream()
                    .map(ProductVariant::getColor)
                    .filter(Objects::nonNull)
                    .filter(c -> !c.isBlank())
                    .distinct()
                    .toList();
        }

        return ProductSummaryResponse.builder()
                .id(product.getId())
                .name(product.getName())
                .slug(product.getSlug())
                .basePrice(product.getBasePrice())
                .discountPrice(product.getDiscountPrice())
                .gender(product.getGender())
                .status(product.getStatus())
                .category(CategoryResponse.fromEntity(product.getCategory()))
                .brand(BrandResponse.fromEntity(product.getBrand()))
                .primaryImageUrl(primaryImg)
                .totalStock(totalStock)
                .availableSizes(sizes)
                .availableColors(colors)
                .createdAt(product.getCreatedAt())
                .build();
    }
}
