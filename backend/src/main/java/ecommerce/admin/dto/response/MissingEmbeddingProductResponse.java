package ecommerce.admin.dto.response;

import ecommerce.admin.entity.Product;
import java.time.LocalDateTime;

/** Sản phẩm chưa có vector embedding thành công trong Qdrant */
public record MissingEmbeddingProductResponse(
        Long id,
        String name,
        String slug,
        Long categoryId,
        Long brandId,
        String status,
        LocalDateTime createdAt) {

    public static MissingEmbeddingProductResponse from(Product p) {
        return new MissingEmbeddingProductResponse(
                p.getId(),
                p.getName(),
                p.getSlug(),
                p.getCategoryId(),
                p.getBrandId(),
                p.getStatus() == null ? null : p.getStatus().name(),
                p.getCreatedAt());
    }
}
