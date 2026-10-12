package ecommerce.product.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import ecommerce.brand.dto.BrandResponse;
import ecommerce.category.dto.CategoryResponse;
import ecommerce.product.entity.Product;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductDetailResponse {

    private Long id;
    private String name;
    private String slug;
    private String description;
    private BigDecimal basePrice;
    private BigDecimal discountPrice;
    private String gender;
    private String status;
    private CategoryResponse category;
    private BrandResponse brand;
    private List<ProductImageResponse> images;
    private List<ProductVariantResponse> variants;
    private Integer totalStock;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime updatedAt;

    public static ProductDetailResponse fromEntity(Product product) {
        if (product == null) {
            return null;
        }

        List<ProductImageResponse> imgList = (product.getImages() != null)
                ? product.getImages().stream().map(ProductImageResponse::fromEntity).toList()
                : Collections.emptyList();

        List<ProductVariantResponse> varList = (product.getVariants() != null)
                ? product.getVariants().stream().map(ProductVariantResponse::fromEntity).toList()
                : Collections.emptyList();

        int totalStock = varList.stream()
                .filter(v -> "ACTIVE".equalsIgnoreCase(v.getStatus()))
                .mapToInt(v -> v.getStockQuantity() != null ? v.getStockQuantity() : 0)
                .sum();

        return ProductDetailResponse.builder()
                .id(product.getId())
                .name(product.getName())
                .slug(product.getSlug())
                .description(product.getDescription())
                .basePrice(product.getBasePrice())
                .discountPrice(product.getDiscountPrice())
                .gender(product.getGender())
                .status(product.getStatus())
                .category(CategoryResponse.fromEntity(product.getCategory()))
                .brand(BrandResponse.fromEntity(product.getBrand()))
                .images(imgList)
                .variants(varList)
                .totalStock(totalStock)
                .createdAt(product.getCreatedAt())
                .updatedAt(product.getUpdatedAt())
                .build();
    }
}
