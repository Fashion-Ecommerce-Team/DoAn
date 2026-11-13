package ecommerce.product.dto;

import ecommerce.product.entity.ProductImage;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductImageResponse {

    private Long id;
    private String imageUrl;
    private Boolean isPrimary;
    private Integer displayOrder;
    private String featureVector;

    public static ProductImageResponse fromEntity(ProductImage image) {
        if (image == null) {
            return null;
        }
        return ProductImageResponse.builder()
                .id(image.getId())
                .imageUrl(image.getImageUrl())
                .isPrimary(image.getIsPrimary())
                .displayOrder(image.getDisplayOrder())
                .featureVector(image.getFeatureVector())
                .build();
    }
}
