package ecommerce.review.dto;

import ecommerce.common.response.PageResponse;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;

import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Tổng hợp đánh giá sản phẩm và danh sách phân trang")
public class ProductReviewSummaryResponse {

    @Schema(description = "Điểm đánh giá trung bình (1.0 - 5.0)", example = "4.8")
    private Double averageRating;

    @Schema(description = "Tổng số lượt đánh giá", example = "25")
    private Long totalReviews;

    @Schema(description = "Số lượng đánh giá theo từng mức sao (1..5)")
    private Map<Integer, Long> ratingCounts;

    @Schema(description = "Danh sách đánh giá phân trang")
    private PageResponse<ReviewResponse> reviews;
}
