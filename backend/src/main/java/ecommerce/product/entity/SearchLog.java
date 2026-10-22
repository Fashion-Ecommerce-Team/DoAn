package ecommerce.product.entity;

import ecommerce.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "search_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SearchLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "query_text", columnDefinition = "TEXT")
    private String queryText;

    @Column(name = "query_image_url", length = 500)
    private String queryImageUrl;

    @Column(name = "search_type", nullable = false, length = 20)
    private String searchType; // 'TEXT', 'IMAGE', 'HYBRID'

    @Column(name = "result_count")
    private Integer resultCount;

    @Column(name = "clicked_product_id")
    private Long clickedProductId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
