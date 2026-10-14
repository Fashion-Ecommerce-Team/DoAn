package ecommerce.admin.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class ProductVariantRequest {
    @NotBlank(message = "Kích thước không được để trống")
    private String size;

    @NotBlank(message = "Màu sắc không được để trống")
    private String color;

    private String sku;

    @Min(value = 0, message = "Giá điều chỉnh không được âm")
    private BigDecimal priceAdjustment;

    @NotNull(message = "Số lượng tồn kho không được để trống")
    @Min(value = 0, message = "Số lượng tồn kho không được âm")
    private Integer stockQuantity;
}
