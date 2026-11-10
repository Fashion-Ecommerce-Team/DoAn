package ecommerce.admin.dto.response;

import ecommerce.admin.entity.PolicyChunk;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PolicyChunkResponse {
    private Long id;
    private Long documentId;
    private String chunkText;
    private Integer chunkIndex;
    private Integer charStart;
    private Integer charEnd;
    private String qdrantPointId;
    private Boolean isEmbedded;
    private LocalDateTime createdAt;

    public static PolicyChunkResponse from(PolicyChunk entity) {
        if (entity == null) return null;
        return PolicyChunkResponse.builder()
                .id(entity.getId())
                .documentId(entity.getDocumentId())
                .chunkText(entity.getChunkText())
                .chunkIndex(entity.getChunkIndex())
                .charStart(entity.getCharStart())
                .charEnd(entity.getCharEnd())
                .qdrantPointId(entity.getQdrantPointId())
                .isEmbedded(entity.getIsEmbedded())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}
