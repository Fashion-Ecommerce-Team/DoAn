package ecommerce.admin.controller;

import ecommerce.admin.dto.request.CouponRequest;
import ecommerce.admin.dto.response.CouponResponse;
import ecommerce.admin.service.CouponService;
import ecommerce.common.response.ApiResponse;
import ecommerce.common.response.PageResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/coupons")
public class AdminCouponController {
    @Autowired
    private CouponService service;

    @GetMapping
    public ApiResponse<PageResponse<CouponResponse>> getList(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ApiResponse.success("Lấy danh sách mã giảm giá thành công", service.getList(search, status, page, size));
    }

    @GetMapping("/{id}")
    public ApiResponse<CouponResponse> getById(@PathVariable Long id) {
        return ApiResponse.success("Lấy thông tin chi tiết mã giảm giá thành công", service.getById(id));
    }

    @PostMapping
    public ApiResponse<CouponResponse> create(@RequestBody CouponRequest request) {
        return ApiResponse.success("Tạo mã giảm giá thành công", service.create(request));
    }

    @PutMapping("/{id}")
    public ApiResponse<CouponResponse> update(@PathVariable Long id,
            @RequestBody CouponRequest request) {
        return ApiResponse.success("Cập nhật mã giảm giá thành công", service.update(id, request));
    }

    @PutMapping("/{id}/status")
    public ApiResponse<Void> updateStatus(@PathVariable Long id,
            @RequestBody Map<String, String> payload) {
        service.updateStatus(id, payload.get("status"));
        return ApiResponse.success("Cập nhật trạng thái mã giảm giá thành công", null);
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ApiResponse.success("Xóa mã giảm giá thành công", null);
    }
}
