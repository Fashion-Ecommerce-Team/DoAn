package ecommerce.admin.dto.request;

import java.util.List;

public class EmbeddingRequests {

    /** Body cho POST /admin/embeddings/sync-batch */
    public record BatchSyncRequest(List<Long> productIds, Boolean onlyMissing) {}

    /** Body cho POST /admin/embeddings/sync (don le hoac danh sach) */
    public record SyncRequest(List<Long> productIds, Boolean onlyMissing) {}
}
