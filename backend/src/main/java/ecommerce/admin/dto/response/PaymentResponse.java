package ecommerce.admin.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentResponse {
    private Long id;
    private Long orderId;
    private String paymentMethod;
    private BigDecimal amount;
    private String paymentStatus;
    private String transactionId;
    private String qrCodeUrl;
    private String paymentResponse;
    private LocalDateTime expiredAt;
    private LocalDateTime paidAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Thông tin đơn hàng liên quan
    private String receiverName;
    private String receiverPhone;
    private BigDecimal orderTotalAmount;
    private String orderStatus;
}
