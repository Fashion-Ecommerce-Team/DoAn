package ecommerce.admin.dto.response;

import lombok.Data;

@Data
public class ProductVariantResponse {
    private Long id;
    private String size;
    private String color;
    private Integer stock;
    private String sku;
    private Boolean status;
}
