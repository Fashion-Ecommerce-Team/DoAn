package ecommerce.admin.controller;

import ecommerce.admin.dto.request.PolicyDocumentRequest;
import ecommerce.admin.dto.response.PolicyDocumentResponse;
import ecommerce.admin.service.PolicyService;
import ecommerce.common.response.ApiResponse;
import ecommerce.common.response.PageResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/policies")
@RequiredArgsConstructor
public class AdminPolicyController {

    private final PolicyService policyService;

    @GetMapping
    public ApiResponse<PageResponse<PolicyDocumentResponse>> getList(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ApiResponse.success("Lấy danh sách chính sách thành công",
                policyService.getList(search, category, status, page, size));
    }

    @GetMapping("/{id}")
    public ApiResponse<PolicyDocumentResponse> getById(@PathVariable Long id) {
        return ApiResponse.success("Lấy chi tiết chính sách thành công",
                policyService.getById(id));
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<PolicyDocumentResponse> create(
            @RequestPart("data") PolicyDocumentRequest request,
            @RequestPart(value = "file", required = false) MultipartFile file) {
        return ApiResponse.success("Tạo chính sách và xử lý văn bản thành công",
                policyService.create(request, file));
    }

    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<PolicyDocumentResponse> update(
            @PathVariable Long id,
            @RequestPart("data") PolicyDocumentRequest request,
            @RequestPart(value = "file", required = false) MultipartFile file) {
        return ApiResponse.success("Cập nhật chính sách thành công",
                policyService.update(id, request, file));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        policyService.delete(id);
        return ApiResponse.success("Xóa chính sách thành công", null);
    }

    @PatchMapping("/{id}/status")
    public ApiResponse<Void> updateStatus(
            @PathVariable Long id,
            @RequestBody Map<String, Boolean> payload) {
        policyService.updateStatus(id, payload.getOrDefault("isActive", true));
        return ApiResponse.success("Cập nhật trạng thái chính sách thành công", null);
    }

    /** Đồng bộ vector BKAI lên Qdrant cho 1 chính sách */
    @PostMapping("/{id}/sync")
    public ApiResponse<PolicyDocumentResponse> syncEmbedding(@PathVariable Long id) {
        return ApiResponse.success("Đồng bộ lại vector BKAI cho chính sách thành công",
                policyService.syncEmbedding(id));
    }

    /** Alias POST /{id}/embedding theo đúng api_specs.md item 71 */
    @PostMapping("/{id}/embedding")
    public ApiResponse<PolicyDocumentResponse> createEmbedding(@PathVariable Long id) {
        return ApiResponse.success("Tạo vector BKAI cho chính sách thành công",
                policyService.syncEmbedding(id));
    }

    /** Xóa embedding của 1 chính sách khỏi Qdrant */
    @DeleteMapping("/{id}/embedding")
    public ApiResponse<PolicyDocumentResponse> deleteEmbedding(@PathVariable Long id) {
        return ApiResponse.success("Đã xóa vector chính sách khỏi Qdrant thành công",
                policyService.deleteEmbedding(id));
    }

    /** Lấy thông tin Policy Collection trên Qdrant */
    @GetMapping("/qdrant/info")
    public ApiResponse<Map<String, Object>> getQdrantInfo() {
        return ApiResponse.success("Lấy thông tin Qdrant Policy thành công",
                policyService.getQdrantInfo());
    }

    /** Xóa sạch toàn bộ points / collection Policy trong Qdrant */
    @DeleteMapping("/qdrant/clear")
    public ApiResponse<Map<String, Object>> clearQdrantCollection() {
        return ApiResponse.success("Làm sạch toàn bộ vector Qdrant của Policy thành công",
                policyService.clearQdrantCollection());
    }

    /** Đồng bộ tất cả các chính sách đang ACTIVE lên Qdrant bằng BKAI */
    @PostMapping("/sync-all")
    public ApiResponse<Map<String, Object>> syncAll() {
        return ApiResponse.success("Đồng bộ toàn bộ chính sách lên Qdrant thành công",
                policyService.syncAll());
    }
}
