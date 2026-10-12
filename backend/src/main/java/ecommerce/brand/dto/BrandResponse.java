package ecommerce.brand.dto;

import ecommerce.brand.entity.Brand;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BrandResponse {

    private Long id;
    private String name;
    private String slug;
    private String description;
    private String logoUrl;
    private String status;

    public static BrandResponse fromEntity(Brand brand) {
        if (brand == null) {
            return null;
        }
        return BrandResponse.builder()
                .id(brand.getId())
                .name(brand.getName())
                .slug(brand.getSlug())
                .description(brand.getDescription())
                .logoUrl(brand.getLogoUrl())
                .status(brand.getStatus())
                .build();
    }
}
