package ecommerce.admin.dto.response;

import lombok.Data;

@Data
public class ProductImageResponse {
    private Long id;
    private String url;
    private Integer displayOrder;
    private Boolean isPrimary;
}
