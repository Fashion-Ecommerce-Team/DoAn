package ecommerce.admin.controller;

import ecommerce.admin.dto.request.UserRequest;
import ecommerce.admin.dto.response.UserAddressResponse;
import ecommerce.admin.dto.response.UserResponse;
import ecommerce.admin.service.UserService;
import ecommerce.common.response.ApiResponse;
import ecommerce.common.response.PageResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/users")
public class AdminUserController {

    @Autowired
    private UserService service;

    @GetMapping
    public ApiResponse<PageResponse<UserResponse>> getList(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ApiResponse.success("Lấy danh sách người dùng thành công", service.getList(search, status, page, size));
    }

    @GetMapping("/{id}")
    public ApiResponse<UserResponse> getById(@PathVariable Long id) {
        return ApiResponse.success("Lấy thông tin chi tiết người dùng thành công", service.getById(id));
    }

    @PutMapping("/{id}")
    public ApiResponse<UserResponse> update(@PathVariable Long id, @RequestBody UserRequest request) {
        return ApiResponse.success("Cập nhật người dùng thành công", service.update(id, request));
    }

    @PatchMapping("/{id}/status")
    public ApiResponse<Void> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        service.updateStatus(id, payload.get("status"));
        return ApiResponse.success("Cập nhật trạng thái người dùng thành công", null);
    }

    @PutMapping("/{id}/role")
    public ApiResponse<Void> updateRole(@PathVariable Long id, @RequestBody Map<String, Long> payload) {
        service.updateRole(id, payload.get("roleId"));
        return ApiResponse.success("Cập nhật vai trò thành công", null);
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ApiResponse.success("Xóa người dùng thành công", null);
    }

    @GetMapping("/{id}/addresses")
    public ApiResponse<List<UserAddressResponse>> getAddresses(@PathVariable Long id) {
        return ApiResponse.success("Lấy danh sách địa chỉ thành công", service.getAddresses(id));
    }
}
