package ecommerce.admin.controller;

import ecommerce.common.response.ApiResponse;
import ecommerce.admin.dto.request.ProductVariantRequest;
import ecommerce.admin.dto.response.ProductVariantResponse;
import ecommerce.admin.service.ProductVariantService;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/admin/products")
@RequiredArgsConstructor
public class AdminProductVariantController {
    private final ProductVariantService variantService;

    @PostMapping("/{id}/variants")
    public ApiResponse<ProductVariantResponse> addVariant(@PathVariable Long id,
            @Valid @RequestBody ProductVariantRequest request) {
        return ApiResponse.success("Thêm biến thể cho sản phẩm thành công", variantService.addVariant(id, request));
    }

    @PutMapping("/variants/{variantId}")
    public ApiResponse<ProductVariantResponse> updateVariant(@PathVariable Long variantId,
            @Valid @RequestBody ProductVariantRequest request) {
        return ApiResponse.success("Cập nhật thông tin biến thể thành công",
                variantService.updateVariant(variantId, request));
    }

    @DeleteMapping("/variants/{variantId}")
    public ApiResponse<Object> deleteVariant(@PathVariable Long variantId) {
        variantService.deleteVariant(variantId);
        return ApiResponse.success("Xóa biến thể sản phẩm thành công", null);
    }

    @PatchMapping("/variants/{variantId}/status")
    public ApiResponse<Object> toggleVariantStatus(@PathVariable Long variantId) {
        variantService.toggleVariantStatus(variantId);
        return ApiResponse.success("Bật/tắt trạng thái biến thể thành công", null);
    }
}

