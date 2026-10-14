package ecommerce.admin.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

@Entity
@Table(name = "order_details")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderDetail {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "order_id")
    private Long orderId;
    @Column(name = "product_variant_id")
    private Long productVariantId;
    @Column(name = "product_name")
    private String productName;
    @Column(name = "product_image_url")
    private String productImageUrl;
    @Column(name = "variant_size")
    private String variantSize;
    @Column(name = "variant_color")
    private String variantColor;
    private Integer quantity;
    @Column(name = "unit_price")
    private BigDecimal unitPrice;
    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
