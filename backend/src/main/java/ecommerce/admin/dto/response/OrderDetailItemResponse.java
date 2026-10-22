package ecommerce.admin.dto.response;

import lombok.*;
import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderDetailItemResponse {
    private Long id;
    private Long productVariantId;
    private String productName;
    private String productImageUrl;
    private String variantSize;
    private String variantColor;
    private Integer quantity;
    private BigDecimal unitPrice;
    private BigDecimal subtotal;
}
