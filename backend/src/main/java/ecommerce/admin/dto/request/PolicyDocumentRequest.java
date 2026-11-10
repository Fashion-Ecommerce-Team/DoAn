package ecommerce.admin.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PolicyDocumentRequest {

    @NotBlank(message = "Tiêu đề chính sách không được để trống")
    private String title;

    private String category; // RETURN, WARRANTY, SHIPPING, PAYMENT, GENERAL

    private String content; // Nội dung chữ nếu nhập trực tiếp

    private Boolean isActive;
}
