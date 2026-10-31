package ecommerce.admin.controller;

import ecommerce.admin.dto.request.EmbeddingRequests;
import ecommerce.admin.dto.response.EmbeddingLogResponse;
import ecommerce.admin.dto.response.JobProgressResponse;
import ecommerce.admin.service.EmbeddingJobService;
import ecommerce.admin.service.EmbeddingSyncService;
import ecommerce.common.response.ApiResponse;
import ecommerce.common.response.PageResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/embeddings")
public class AdminEmbeddingController {

    @Autowired
    private EmbeddingSyncService syncService;

    @Autowired
    private EmbeddingJobService jobService;

    /** 1. Lấy danh sách embedding log (phân trang, lọc theo status, productId) */
    @GetMapping
    public ApiResponse<PageResponse<EmbeddingLogResponse>> getList(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long productId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ApiResponse.success("Lấy danh sách embedding thành công",
                syncService.getList(status, productId, page, size));
    }

    /** 2. Thống kê tổng quan trạng thái đồng bộ vector */
    @GetMapping("/status")
    public ApiResponse<Map<String, Object>> getStatus() {
        return ApiResponse.success("Lấy thống kê đồng bộ thành công", syncService.getStatus());
    }

    /** 3. Thông tin Collection trong Qdrant */
    @GetMapping("/qdrant/info")
    public ApiResponse<Map<String, Object>> getQdrantInfo() {
        return ApiResponse.success("Lấy thông tin Qdrant thành công", syncService.qdrantInfo());
    }

    /** 4. Đồng bộ embedding cho 1 sản phẩm */
    @PostMapping("/{productId}/sync")
    public ApiResponse<Map<String, Object>> syncOneProduct(@PathVariable Long productId) {
        return ApiResponse.success("Đồng bộ embedding sản phẩm thành công", syncService.syncProduct(productId));
    }

    /** 5. Xóa toàn bộ embedding của sản phẩm khỏi Qdrant và DB log */
    @DeleteMapping("/{productId}")
    public ApiResponse<Void> deleteProductEmbedding(@PathVariable Long productId) {
        syncService.deleteProduct(productId);
        return ApiResponse.success("Xóa embedding sản phẩm thành công", null);
    }

    /** 6. Đồng bộ hàng loạt chạy ngầm (Background Job trả về jobId) */
    @PostMapping("/sync-batch")
    public ApiResponse<JobProgressResponse> syncBatch(
            @RequestBody(required = false) EmbeddingRequests.BatchSyncRequest request) {
        JobProgressResponse job = jobService.startBatchSync(request);
        return ApiResponse.success("Đã khởi chạy tiến trình đồng bộ hàng loạt", job);
    }

    /** Alias POST /sync để tương thích với api_specs.md */
    @PostMapping("/sync")
    public ApiResponse<JobProgressResponse> sync(
            @RequestBody(required = false) EmbeddingRequests.BatchSyncRequest request) {
        return syncBatch(request);
    }

    /** 7. Theo dõi tiến độ tiến trình (Job Progress) theo jobId */
    @GetMapping("/jobs/{jobId}")
    public ApiResponse<JobProgressResponse> getJobProgress(@PathVariable String jobId) {
        return ApiResponse.success("Lấy tiến độ tiến trình thành công", jobService.getJobProgress(jobId));
    }

    /** 8. Admin chủ động kích hoạt kiểm tra và sửa lệch dữ liệu (Reconcile) */
    @PostMapping("/reconcile")
    public ApiResponse<JobProgressResponse> triggerReconcile() {
        JobProgressResponse job = jobService.startReconcile();
        return ApiResponse.success("Đã khởi chạy tiến trình sửa lệch dữ liệu Qdrant", job);
    }

    /** 9. Chạy lại nhanh các bản ghi FAILED hoặc cần sync lại */
    @PostMapping("/retry-failed")
    public ApiResponse<Map<String, Object>> retryFailed() {
        return ApiResponse.success("Đã chạy lại các embedding lỗi", syncService.retryFailed());
    }
}
