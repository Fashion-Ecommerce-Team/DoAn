package ecommerce.admin.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JobProgressResponse {
    private String jobId;
    private String type; // BATCH_SYNC, RECONCILE
    private String status; // PENDING, RUNNING, COMPLETED, FAILED
    private int total;
    private int processed;
    private int successCount;
    private int failedCount;
    private int skippedCount;
    private double percent;
    private String message;
    private LocalDateTime createdAt;
    private LocalDateTime finishedAt;
}
