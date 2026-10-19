package ecommerce.admin.controller;

import ecommerce.admin.dto.request.BannerRequest;
import ecommerce.admin.dto.response.BannerResponse;
import ecommerce.admin.service.BannerService;
import ecommerce.common.response.ApiResponse;
import ecommerce.common.response.PageResponse;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/banners")
public class AdminBannerController {
    @Autowired
    private BannerService service;

    @GetMapping
    public ApiResponse<PageResponse<BannerResponse>> getList(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String position,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ApiResponse.success("Lấy danh sách banner thành công", service.getList(search, status, position, page, size));
    }

    @GetMapping("/{id}")
    public ApiResponse<BannerResponse> getById(@PathVariable Long id) {
        return ApiResponse.success("Lấy thông tin chi tiết banner thành công", service.getById(id));
    }

    @PostMapping
    public ApiResponse<BannerResponse> create(@Valid @RequestBody BannerRequest request) {
        return ApiResponse.success("Tạo banner thành công", service.create(request));
    }

    @PutMapping("/{id}")
    public ApiResponse<BannerResponse> update(@PathVariable Long id,
            @Valid @RequestBody BannerRequest request) {
        return ApiResponse.success("Cập nhật banner thành công", service.update(id, request));
    }

    @PatchMapping("/{id}/status")
    public ApiResponse<Void> updateStatus(@PathVariable Long id,
            @RequestBody Map<String, String> payload) {
        service.updateStatus(id, payload.get("status"));
        return ApiResponse.success("Cập nhật trạng thái banner thành công", null);
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ApiResponse.success("Xóa banner thành công", null);
    }
}
