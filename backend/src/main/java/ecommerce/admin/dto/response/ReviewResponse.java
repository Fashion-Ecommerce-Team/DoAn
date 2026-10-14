package ecommerce.admin.dto.response;

import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReviewResponse {
    private Long id;
    private Long userId;
    private String userName;
    private String userEmail;
    private String userAvatar;
    private Long productId;
    private String productName;
    private String productImage;
    private Long orderId;
    private Integer rating;
    private String comment;
    private String sentimentLabel;
    private Boolean isVerifiedPurchase;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
