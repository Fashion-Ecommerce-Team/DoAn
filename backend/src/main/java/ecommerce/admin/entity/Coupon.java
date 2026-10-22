package ecommerce.admin.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

@Entity
@Table(name = "coupons")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Coupon {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String code;
    private String description;
    @Column(name = "discount_type")
    private String discountType;
    @Column(name = "discount_value")
    private BigDecimal discountValue;
    @Column(name = "min_order_value")
    private BigDecimal minOrderValue;
    @Column(name = "max_discount_amount")
    private BigDecimal maxDiscountAmount;
    @Column(name = "usage_limit")
    private Integer usageLimit;
    @Column(name = "used_count")
    private Integer usedCount;
    @Column(name = "start_date")
    private LocalDateTime startDate;
    @Column(name = "end_date")
    private LocalDateTime endDate;
    private String status;
    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
