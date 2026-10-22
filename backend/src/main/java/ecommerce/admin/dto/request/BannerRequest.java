package ecommerce.admin.dto.request;
import jakarta.validation.constraints.NotBlank;
import lombok.*;
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BannerRequest {
    @NotBlank(message = "Tiêu đề banner không được để trống")
    private String title;
    private String subtitle;
    @NotBlank(message = "Hình ảnh banner không được để trống")
    private String imageUrl;
    private String cloudinaryPublicId;
    private String linkUrl;
    private String position;
    private Integer displayOrder;
    private String status;

}
