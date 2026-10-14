package ecommerce.admin.controller;

import ecommerce.admin.dto.response.ReviewResponse;
import ecommerce.admin.service.ReviewService;
import ecommerce.common.response.ApiResponse;
import ecommerce.common.response.PageResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/reviews")
public class AdminReviewController {
    @Autowired
    private ReviewService service;

    @GetMapping
    public ApiResponse<PageResponse<ReviewResponse>> getList(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long productId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ApiResponse.success("Lấy danh sách đánh giá thành công",
                service.getList(search, status, productId, page, size));
    }

    @GetMapping("/{id}")
    public ApiResponse<ReviewResponse> getById(@PathVariable Long id) {
        return ApiResponse.success("Lấy thông tin chi tiết đánh giá thành công", service.getById(id));
    }

    @PutMapping("/{id}/status")
    public ApiResponse<Void> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        service.updateStatus(id, payload.get("status"));
        return ApiResponse.success("Cập nhật trạng thái đánh giá thành công", null);
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ApiResponse.success("Xóa đánh giá thành công", null);
    }
}
