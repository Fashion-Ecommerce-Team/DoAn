package ecommerce.admin.dto.response;

import ecommerce.admin.entity.EmbeddingSyncLog;
import java.time.LocalDateTime;

public record EmbeddingLogResponse(
        Long id,
        Long productId,
        Long imageId,
        String qdrantPointId,
        String modelVersion,
        String embeddingType,
        String status,
        Boolean needsResync,
        String errorMessage,
        LocalDateTime syncedAt,
        LocalDateTime updatedAt) {

    public static EmbeddingLogResponse from(EmbeddingSyncLog l) {
        return new EmbeddingLogResponse(
                l.getId(),
                l.getProductId(),
                l.getImageId(),
                l.getQdrantPointId(),
                l.getModelVersion(),
                l.getEmbeddingType(),
                l.getStatus(),
                l.getNeedsResync() != null && l.getNeedsResync(),
                l.getErrorMessage(),
                l.getSyncedAt(),
                l.getUpdatedAt());
    }
}
