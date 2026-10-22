package ecommerce.admin.controller;

import ecommerce.common.response.ApiResponse;
import ecommerce.admin.dto.request.ProductImageRequest;
import ecommerce.admin.dto.response.ProductImageResponse;
import ecommerce.admin.service.ProductImageService;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/products")
@RequiredArgsConstructor
public class AdminProductImageController {
    private final ProductImageService imageService;

    @PostMapping("/{id}/images")
    public ApiResponse<ProductImageResponse> addImage(@PathVariable Long id, @Valid @RequestBody ProductImageRequest request) {
        return ApiResponse.success("Thêm hình ảnh cho sản phẩm thành công", imageService.addImage(id, request));
    }

    @PostMapping("/{id}/images/batch")
    public ApiResponse<List<ProductImageResponse>> addImages(@PathVariable Long id, @Valid @RequestBody List<ProductImageRequest> requests) {
        return ApiResponse.success("Thêm danh sách hình ảnh cho sản phẩm thành công", imageService.addImages(id, requests));
    }

    @PutMapping("/images/{imageId}")
    public ApiResponse<ProductImageResponse> updateImage(@PathVariable Long imageId,
            @Valid @RequestBody ProductImageRequest request) {
        return ApiResponse.success("Cập nhật thông tin hình ảnh thành công",
                imageService.updateImage(imageId, request));
    }

    @PatchMapping("/images/{imageId}/primary")
    public ApiResponse<Object> setPrimaryImage(@PathVariable Long imageId) {
        imageService.setPrimaryImage(imageId);
        return ApiResponse.success("Đặt hình ảnh làm ảnh đại diện chính thành công", null);
    }

    @DeleteMapping("/images/{imageId}")
    public ApiResponse<Object> deleteImage(@PathVariable Long imageId) {
        imageService.deleteImage(imageId);
        return ApiResponse.success("Xóa hình ảnh sản phẩm thành công", null);
    }
}


