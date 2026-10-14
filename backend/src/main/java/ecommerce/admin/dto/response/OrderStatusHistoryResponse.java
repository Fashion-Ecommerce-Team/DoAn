package ecommerce.admin.dto.response;

import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderStatusHistoryResponse {
    private Long id;
    private Long orderId;
    private String oldStatus;
    private String newStatus;
    private Long changedBy;
    private String changedByName;
    private String note;
    private LocalDateTime createdAt;
}
