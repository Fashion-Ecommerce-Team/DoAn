package ecommerce.brand.controller;

import ecommerce.brand.dto.BrandResponse;
import ecommerce.brand.service.BrandService;
import ecommerce.common.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/brands")
@Tag(name = "Brands", description = "APIs thương hiệu sản phẩm")
public class BrandController {

    private final BrandService brandService;

    public BrandController(BrandService brandService) {
        this.brandService = brandService;
    }

    @GetMapping
    @Operation(summary = "Lấy danh sách thương hiệu sản phẩm", description = "Lấy toàn bộ thương hiệu sản phẩm đang hoạt động")
    public ResponseEntity<ApiResponse<List<BrandResponse>>> getBrands() {
        List<BrandResponse> brands = brandService.getActiveBrands();
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách thương hiệu thành công!", brands));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Lấy chi tiết thương hiệu theo ID")
    public ResponseEntity<ApiResponse<BrandResponse>> getBrandById(@PathVariable Long id) {
        BrandResponse brand = brandService.getBrandById(id);
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin thương hiệu thành công!", brand));
    }
}
