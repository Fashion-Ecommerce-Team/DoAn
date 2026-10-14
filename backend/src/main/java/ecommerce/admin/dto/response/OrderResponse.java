package ecommerce.admin.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class OrderResponse {
    private Long id;
    private Long userId;
    private Long couponId;
    private String receiverName;
    private String receiverPhone;
    private String shippingAddress;
    private String customerDefaultAddress;
    private String orderNote;
    private BigDecimal subtotalAmount;
    private BigDecimal shippingFee;
    private BigDecimal discountAmount;
    private BigDecimal totalAmount;
    private String status;
    private LocalDateTime cancelledAt;
    private String cancelReason;

    // Payment details
    private String paymentMethod;
    private String paymentStatus;
    private String transactionId;
    private LocalDateTime paidAt;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Chi tiết danh sách sản phẩm trong đơn hàng
    private List<OrderDetailItemResponse> items;

    // Lịch sử trạng thái đơn hàng
    private List<OrderStatusHistoryResponse> statusHistory;
}
