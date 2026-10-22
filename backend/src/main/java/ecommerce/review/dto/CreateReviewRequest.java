package ecommerce.review.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Yêu cầu tạo đánh giá sản phẩm mới")
public class CreateReviewRequest {

    @NotNull(message = "ID sản phẩm (productId) không được để trống")
    @Schema(description = "ID của sản phẩm cần đánh giá", example = "1")
    private Long productId;

    @Schema(description = "ID của chi tiết đơn hàng (nếu đánh giá từ lịch sử đơn hàng)", example = "10")
    private Long orderDetailId;

    @NotNull(message = "Số sao đánh giá (rating) không được để trống")
    @Min(value = 1, message = "Số sao tối thiểu là 1")
    @Max(value = 5, message = "Số sao tối đa là 5")
    @Schema(description = "Số sao đánh giá từ 1 đến 5", example = "5")
    private Integer rating;

    @Schema(description = "Nội dung nhận xét/đánh giá", example = "Sản phẩm chất vải rất mát, form rộng đẹp đúng như mô tả!")
    private String comment;
}
