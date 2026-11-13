package ecommerce.admin.dto.response;

import ecommerce.admin.entity.PolicyDocument;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PolicyDocumentResponse {
    private Long id;
    private String title;
    private String slug;
    private String content;
    private String fileName;
    private String fileUrl;
    private String category;
    private Integer version;
    private Boolean isActive;
    private Integer chunkCount;
    private String embeddingStatus;
    private Boolean needsResync;
    private Long createdBy;
    private Long updatedBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Danh sách chunks kèm theo (dùng cho API xem chi tiết)
    private List<PolicyChunkResponse> chunks;

    public static PolicyDocumentResponse from(PolicyDocument entity) {
        if (entity == null) return null;
        return PolicyDocumentResponse.builder()
                .id(entity.getId())
                .title(entity.getTitle())
                .slug(entity.getSlug())
                .content(entity.getContent())
                .fileName(entity.getFileName())
                .fileUrl(entity.getFileUrl())
                .category(entity.getCategory())
                .version(entity.getVersion())
                .isActive(entity.getIsActive())
                .chunkCount(entity.getChunkCount())
                .embeddingStatus(entity.getEmbeddingStatus())
                .needsResync(entity.getNeedsResync())
                .createdBy(entity.getCreatedBy())
                .updatedBy(entity.getUpdatedBy())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
