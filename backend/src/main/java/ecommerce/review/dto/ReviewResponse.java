package ecommerce.review.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import ecommerce.review.entity.Review;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Thông tin chi tiết một đánh giá sản phẩm")
public class ReviewResponse {

    private Long id;
    private Long productId;
    private String productName;
    private String productSlug;
    private Long userId;
    private String userFullName;
    private String userAvatarUrl;
    private Long orderDetailId;
    private Integer rating;
    private String comment;
    private String sentimentLabel;
    private Boolean isVerifiedPurchase;
    private String status;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;

    public static ReviewResponse fromEntity(Review review) {
        if (review == null) {
            return null;
        }

        Long prodId = review.getProduct() != null ? review.getProduct().getId() : null;
        String prodName = review.getProduct() != null ? review.getProduct().getName() : null;
        String prodSlug = review.getProduct() != null ? review.getProduct().getSlug() : null;

        Long uId = review.getUser() != null ? review.getUser().getId() : null;
        String uName = review.getUser() != null ? review.getUser().getFullName() : null;
        String uAvatar = review.getUser() != null ? review.getUser().getAvatarUrl() : null;

        return ReviewResponse.builder()
                .id(review.getId())
                .productId(prodId)
                .productName(prodName)
                .productSlug(prodSlug)
                .userId(uId)
                .userFullName(uName)
                .userAvatarUrl(uAvatar)
                .orderDetailId(review.getOrderDetailId())
                .rating(review.getRating())
                .comment(review.getComment())
                .sentimentLabel(review.getSentimentLabel())
                .isVerifiedPurchase(review.getIsVerifiedPurchase())
                .status(review.getStatus())
                .createdAt(review.getCreatedAt())
                .build();
    }
}
