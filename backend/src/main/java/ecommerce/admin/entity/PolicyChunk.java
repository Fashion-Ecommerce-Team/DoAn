package ecommerce.admin.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

@Entity
@Table(name = "policy_chunks")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PolicyChunk {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "document_id")
    private Long documentId;
    @Column(name = "chunk_text")
    private String chunkText;
    @Column(name = "chunk_index")
    private Integer chunkIndex;
    @Column(name = "char_start")
    private Integer charStart;
    @Column(name = "char_end")
    private Integer charEnd;
    @Column(name = "qdrant_point_id")
    private String qdrantPointId;
    @Column(name = "is_embedded")
    private Boolean isEmbedded;
    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
