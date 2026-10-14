package ecommerce.admin.controller;

import ecommerce.common.response.ApiResponse;
import ecommerce.common.response.PageResponse;
import ecommerce.admin.dto.request.ProductRequest;
import ecommerce.admin.dto.response.ProductResponse;
import ecommerce.admin.service.ProductService;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/admin/products")
@RequiredArgsConstructor
public class AdminProductController {
    private final ProductService productService;

    @GetMapping
    public ApiResponse<PageResponse<ProductResponse>> getAllProducts(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ApiResponse.success("Lấy danh sách sản phẩm thành công", productService.getAllProducts(keyword, categoryId, page, size));
    }

    @GetMapping("/{id}")
    public ApiResponse<ProductResponse> getProductById(@PathVariable Long id) {
        return ApiResponse.success("Lấy thông tin chi tiết sản phẩm thành công", productService.getProductById(id));
    }

    @PostMapping
    public ApiResponse<ProductResponse> createProduct(@Valid @RequestBody ProductRequest request) {
        return ApiResponse.success("Tạo sản phẩm mới thành công", productService.createProduct(request));
    }

    @PutMapping("/{id}")
    public ApiResponse<ProductResponse> updateProduct(@PathVariable Long id, @Valid @RequestBody ProductRequest request) {
        return ApiResponse.success("Cập nhật thông tin sản phẩm thành công", productService.updateProduct(id, request));
    }

    @PatchMapping("/{id}/toggle-status")
    public ApiResponse<Object> toggleProductStatus(@PathVariable Long id) {
        productService.toggleProductStatus(id);
        return ApiResponse.success("Cập nhật trạng thái sản phẩm thành công", null);
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Object> deleteProduct(@PathVariable Long id) {
        productService.deleteProduct(id);
        return ApiResponse.success("Xóa sản phẩm thành công", null);
    }
}

