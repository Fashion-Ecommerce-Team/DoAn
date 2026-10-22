package ecommerce.admin.controller;

import ecommerce.admin.dto.request.BrandRequest;
import ecommerce.admin.dto.response.BrandResponse;
import ecommerce.admin.service.BrandService;
import ecommerce.common.response.ApiResponse;
import ecommerce.common.response.PageResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/brands")
public class AdminBrandController {

    @Autowired
    private BrandService service;

    @GetMapping
    public ApiResponse<PageResponse<BrandResponse>> getList(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ApiResponse.success("Lấy danh sách thương hiệu thành công", service.getList(search, status, page, size));
    }

    @GetMapping("/{id}")
    public ApiResponse<BrandResponse> getById(@PathVariable Long id) {
        return ApiResponse.success("Lấy thông tin chi tiết thương hiệu thành công", service.getById(id));
    }

    @PostMapping
    public ApiResponse<BrandResponse> create(@RequestBody BrandRequest request) {
        return ApiResponse.success("Tạo thương hiệu thành công", service.create(request));
    }

    @PutMapping("/{id}")
    public ApiResponse<BrandResponse> update(@PathVariable Long id, @RequestBody BrandRequest request) {
        return ApiResponse.success("Cập nhật thương hiệu thành công", service.update(id, request));
    }

    @PatchMapping("/{id}/status")
    public ApiResponse<Void> updateStatus(@PathVariable Long id,
            @RequestBody Map<String, String> payload) {
        service.updateStatus(id, payload.get("status"));
        return ApiResponse.success("Cập nhật trạng thái thương hiệu thành công", null);
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ApiResponse.success("Xóa thương hiệu thành công", null);
    }
}
