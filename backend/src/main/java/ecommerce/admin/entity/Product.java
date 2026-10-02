package ecommerce.admin.entity;

import ecommerce.common.constant.EntityStatus;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "products")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Product {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "category_id")
    private Long categoryId;
    @Column(name = "brand_id")
    private Long brandId;
    private String name;
    private String slug;
    private String description;
    @Column(name = "short_description")
    private String shortDescription;
    @Column(name = "base_price")
    private BigDecimal basePrice;
    @Column(name = "discount_price")
    private BigDecimal discountPrice;
    private String gender;
    private String tags;
    @Column(name = "view_count")
    private Integer viewCount;
    @Enumerated(EnumType.STRING)
    private EntityStatus status;
    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;
}
