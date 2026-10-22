package ecommerce.admin.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ProductResponse {
    private Long id;
    private Long categoryId;
    private Long brandId;
    private String name;
    private String slug;
    private String description;
    private String shortDescription;
    private BigDecimal basePrice;
    private BigDecimal discountPrice;
    private String gender;
    private String tags;
    private Integer viewCount;
    private String status;
    private LocalDateTime updatedAt;
    private LocalDateTime createdAt;
    
    private List<ProductImageResponse> images;
    private List<ProductVariantResponse> variants;
}
