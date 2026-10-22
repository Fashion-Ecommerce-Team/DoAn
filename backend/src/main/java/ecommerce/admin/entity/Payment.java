package ecommerce.admin.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

@Entity
@Table(name = "payments")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Payment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "order_id")
    private Long orderId;
    @Column(name = "payment_method")
    private String paymentMethod;
    private BigDecimal amount;
    @Column(name = "payment_status")
    private String paymentStatus;
    @Column(name = "transaction_id")
    private String transactionId;
    @Column(name = "qr_code_url")
    private String qrCodeUrl;
    @Column(name = "payment_response")
    private String paymentResponse;
    @Column(name = "expired_at")
    private LocalDateTime expiredAt;
    @Column(name = "paid_at")
    private LocalDateTime paidAt;
    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
