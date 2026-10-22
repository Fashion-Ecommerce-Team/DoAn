package ecommerce.admin.dto.request;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ProductImageRequest {
    @NotBlank(message = "Đường dẫn ảnh không được để trống")
    private String imageUrl;
    
    @NotBlank(message = "Cloudinary ID không được để trống")
    private String cloudinaryPublicId;
    
    private Integer displayOrder;
}
