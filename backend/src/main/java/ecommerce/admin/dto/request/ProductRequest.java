package ecommerce.admin.dto.request;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class ProductRequest {
    @NotNull(message = "Danh mục không được để trống")
    private Long categoryId;
    private Long brandId;
    
    @NotBlank(message = "Tên sản phẩm không được để trống")
    private String name;
    private String description;
    private String shortDescription;
    
    @NotNull(message = "Giá gốc không được để trống")
    @Min(value = 0, message = "Giá gốc không được âm")
    private BigDecimal basePrice;
    
    @Min(value = 0, message = "Giá khuyến mãi không được âm")
    private BigDecimal discountPrice;
    
    private String gender; // MALE, FEMALE, UNISEX
    private String tags;
}
