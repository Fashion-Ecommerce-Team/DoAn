
package ecommerce.product.dto;

import java.math.BigDecimal;
import java.util.List;

public record RagProductResponse(
        Long id,
        String name,
        String description,
        String slug,
        BigDecimal basePrice,
        BigDecimal discountPrice,
        BigDecimal currentPrice,
        String gender,
        String categoryName,
        String brandName,
        List<VariantInfo> variants
) {
    public record VariantInfo(
            Long id,
            String size,
            String color,
            Integer stockQuantity
    ) {}
}
