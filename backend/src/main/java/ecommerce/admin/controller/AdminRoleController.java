package ecommerce.admin.controller;

import ecommerce.admin.dto.response.RoleResponse;
import ecommerce.admin.service.RoleService;
import ecommerce.common.response.ApiResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/roles")
public class AdminRoleController {
    @Autowired
    private RoleService service;

    @GetMapping
    public ApiResponse<List<RoleResponse>> getAll() {
        return ApiResponse.success("Lấy danh sách vai trò thành công", service.getAll());
    }
}
