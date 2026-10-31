package ecommerce.admin.service.impl;

import ecommerce.admin.dto.request.EmbeddingRequests;
import ecommerce.admin.dto.response.JobProgressResponse;
import ecommerce.admin.entity.EmbeddingSyncLog;
import ecommerce.admin.entity.Product;
import ecommerce.admin.repository.EmbeddingSyncLogRepository;
import ecommerce.admin.repository.ProductRepository;
import ecommerce.admin.service.EmbeddingJobService;
import ecommerce.admin.service.EmbeddingSyncService;
import ecommerce.common.constant.EntityStatus;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
public class EmbeddingJobServiceImpl implements EmbeddingJobService {

    @Autowired private EmbeddingSyncService syncService;
    @Autowired private ProductRepository productRepo;
    @Autowired private EmbeddingSyncLogRepository logRepo;

    @Value("${embedding.reconcile.enabled:false}")
    private boolean reconcileEnabled;

    private final Map<String, JobProgressResponse> jobStore = new ConcurrentHashMap<>();

    @Override
    public JobProgressResponse startBatchSync(EmbeddingRequests.BatchSyncRequest request) {
        String jobId = UUID.randomUUID().toString();
        List<Long> ids;
        if (request != null && request.productIds() != null && !request.productIds().isEmpty()) {
            ids = new ArrayList<>(request.productIds());
        } else {
            ids = productRepo.findAll().stream()
                    .filter(p -> p.getStatus() != EntityStatus.DELETED)
                    .map(Product::getId)
                    .toList();
        }

        boolean onlyMissing = request != null && Boolean.TRUE.equals(request.onlyMissing());

        JobProgressResponse job = JobProgressResponse.builder()
                .jobId(jobId)
                .type("BATCH_SYNC")
                .status("RUNNING")
                .total(ids.size())
                .processed(0)
                .successCount(0)
                .failedCount(0)
                .skippedCount(0)
                .percent(0.0)
                .message("Đang bắt đầu đồng bộ " + ids.size() + " sản phẩm...")
                .createdAt(LocalDateTime.now())
                .build();

        jobStore.put(jobId, job);

        // Chạy bất đồng bộ
        CompletableFuture.runAsync(() -> executeBatchSync(jobId, ids, onlyMissing));

        return job;
    }

    @Override
    public JobProgressResponse startReconcile() {
        String jobId = UUID.randomUUID().toString();

        // Lấy tất cả sản phẩm cần bù (needs_resync = true hoặc FAILED)
        Set<Long> productIds = new LinkedHashSet<>();
        logRepo.findByNeedsResyncTrue().forEach(l -> productIds.add(l.getProductId()));
        logRepo.findByStatus("FAILED").forEach(l -> productIds.add(l.getProductId()));

        JobProgressResponse job = JobProgressResponse.builder()
                .jobId(jobId)
                .type("RECONCILE")
                .status("RUNNING")
                .total(productIds.size())
                .processed(0)
                .successCount(0)
                .failedCount(0)
                .skippedCount(0)
                .percent(0.0)
                .message("Bắt đầu sửa lệch cho " + productIds.size() + " sản phẩm cần sync lại...")
                .createdAt(LocalDateTime.now())
                .build();

        jobStore.put(jobId, job);

        CompletableFuture.runAsync(() -> executeReconcile(jobId, new ArrayList<>(productIds)));

        return job;
    }

    @Override
    public JobProgressResponse getJobProgress(String jobId) {
        JobProgressResponse job = jobStore.get(jobId);
        if (job == null) {
            return JobProgressResponse.builder()
                    .jobId(jobId)
                    .status("NOT_FOUND")
                    .message("Không tìm thấy thông tin tiến trình jobId=" + jobId)
                    .build();
        }
        return job;
    }

    /**
     * Job tự động chạy lúc 2h sáng (mặc định tắt, bật khi cấu hình embedding.reconcile.enabled=true)
     */
    @Scheduled(cron = "${embedding.reconcile.cron:0 0 2 * * *}")
    public void scheduledReconcile() {
        if (!reconcileEnabled) {
            return;
        }
        log.info("[Cron 2h00] Bắt đầu kiểm tra và tự động sửa lệch dữ liệu Qdrant...");
        startReconcile();
    }

    // =========================================================
    // BACKGROUND EXECUTION HELPERS
    // =========================================================

    private void executeBatchSync(String jobId, List<Long> productIds, boolean onlyMissing) {
        JobProgressResponse job = jobStore.get(jobId);
        int processed = 0;
        int success = 0;
        int failed = 0;
        int skipped = 0;

        for (Long pid : productIds) {
            try {
                if (onlyMissing) {
                    List<EmbeddingSyncLog> existing = logRepo.findByProductId(pid);
                    boolean alreadySynced = existing.stream().anyMatch(l -> "SUCCESS".equals(l.getStatus()));
                    if (alreadySynced) {
                        skipped++;
                        processed++;
                        updateJobProgress(job, processed, success, failed, skipped);
                        continue;
                    }
                }

                Map<String, Object> syncRes = syncService.syncProduct(pid);
                int okImages = (int) syncRes.getOrDefault("successImages", 0);
                int failImages = (int) syncRes.getOrDefault("failedImages", 0);

                if (failImages == 0 && okImages > 0) {
                    success++;
                } else if (failImages > 0) {
                    failed++;
                } else {
                    skipped++; // ví dụ NO_IMAGE
                }
            } catch (Exception e) {
                log.error("Lỗi khi batch sync product id={}: {}", pid, e.getMessage());
                failed++;
            }

            processed++;
            updateJobProgress(job, processed, success, failed, skipped);
        }

        job.setStatus("COMPLETED");
        job.setMessage(String.format("Đã hoàn tất đồng bộ: %d thành công, %d thất bại, %d bỏ qua.", success, failed, skipped));
        job.setFinishedAt(LocalDateTime.now());
    }

    private void executeReconcile(String jobId, List<Long> productIds) {
        JobProgressResponse job = jobStore.get(jobId);
        int processed = 0;
        int success = 0;
        int failed = 0;

        for (Long pid : productIds) {
            try {
                // Thử cập nhật payload nhẹ trước
                syncService.refreshProductPayload(pid);
                // Nếu sản phẩm vẫn có ảnh bị FAILED thì sync lại ảnh
                List<EmbeddingSyncLog> failedLogs = logRepo.findByProductId(pid).stream()
                        .filter(l -> "FAILED".equals(l.getStatus())).toList();
                if (!failedLogs.isEmpty()) {
                    syncService.syncProduct(pid);
                }
                success++;
            } catch (Exception e) {
                log.error("Lỗi khi reconcile product id={}: {}", pid, e.getMessage());
                failed++;
            }

            processed++;
            updateJobProgress(job, processed, success, failed, 0);
        }

        job.setStatus("COMPLETED");
        job.setMessage(String.format("Đã hoàn tất sửa lệch: %d thành công, %d thất bại.", success, failed));
        job.setFinishedAt(LocalDateTime.now());
    }

    private void updateJobProgress(JobProgressResponse job, int processed, int success, int failed, int skipped) {
        if (job == null) return;
        job.setProcessed(processed);
        job.setSuccessCount(success);
        job.setFailedCount(failed);
        job.setSkippedCount(skipped);
        if (job.getTotal() > 0) {
            double pct = Math.round(((double) processed / job.getTotal()) * 1000.0) / 10.0;
            job.setPercent(pct);
        }
    }
}
