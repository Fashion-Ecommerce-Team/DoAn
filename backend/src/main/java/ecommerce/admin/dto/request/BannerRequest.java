package ecommerce.admin.dto.request;
import lombok.*;
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BannerRequest {
    private String title;
    private String subtitle;
    private String imageUrl;
    private String cloudinaryPublicId;
    private String linkUrl;
    private String position;
    private Integer displayOrder;
    private String status;

}
