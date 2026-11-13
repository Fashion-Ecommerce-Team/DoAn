package ecommerce.notification.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationRequest {

    @NotNull(message = "User ID không được để trống")
    @Schema(description = "ID của người dùng nhận thông báo", example = "1")
    private Long userId;

    @NotBlank(message = "Tiêu đề không được để trống")
    @Schema(description = "Tiêu đề thông báo", example = "Khuyến mãi tháng 10")
    private String title;

    @NotBlank(message = "Nội dung không được để trống")
    @Schema(description = "Nội dung thông báo", example = "Giảm giá 20% cho toàn bộ sản phẩm áo thun...")
    private String message;

    @Schema(description = "Loại thông báo (SYSTEM, ORDER, PROMOTION, ACCOUNT)", example = "PROMOTION")
    private String type;
}
