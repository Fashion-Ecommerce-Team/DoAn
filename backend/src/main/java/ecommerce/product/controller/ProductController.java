package ecommerce.product.controller;

import ecommerce.common.response.ApiResponse;
import ecommerce.common.response.PageResponse;
import ecommerce.product.dto.ProductDetailResponse;
import ecommerce.product.dto.ProductFilterRequest;
import ecommerce.product.dto.ProductSummaryResponse;
import ecommerce.product.service.ProductService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/products")
@Tag(name = "Products", description = "APIs khám phá, tìm kiếm và chi tiết sản phẩm")
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    @GetMapping
    @Operation(summary = "Khám phá danh sách sản phẩm (có phân trang, bộ lọc)", 
               description = "Lấy danh sách sản phẩm hỗ trợ lọc theo danh mục, thương hiệu, giá, giới tính và sắp xếp")
    public ResponseEntity<ApiResponse<PageResponse<ProductSummaryResponse>>> exploreProducts(
            @ModelAttribute ProductFilterRequest filter) {
        PageResponse<ProductSummaryResponse> response = productService.exploreProducts(filter);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách sản phẩm thành công!", response));
    }

    @GetMapping("/search")
    @Operation(summary = "Tìm kiếm sản phẩm cơ bản (có phân trang)", 
               description = "Tìm kiếm sản phẩm theo từ khóa (tên, mô tả) kết hợp bộ lọc và phân trang")
    public ResponseEntity<ApiResponse<PageResponse<ProductSummaryResponse>>> searchProducts(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false, name = "q") String q,
            @ModelAttribute ProductFilterRequest filter) {
        // Support both ?keyword=... and ?q=...
        if (keyword != null && !keyword.isBlank()) {
            filter.setKeyword(keyword);
        } else if (q != null && !q.isBlank()) {
            filter.setKeyword(q);
        }

        PageResponse<ProductSummaryResponse> response = productService.searchProducts(filter);
        return ResponseEntity.ok(ApiResponse.success("Tìm kiếm sản phẩm thành công!", response));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Xem chi tiết sản phẩm theo ID", 
               description = "Lấy thông tin chi tiết của sản phẩm bao gồm biến thể (size, màu, tồn kho, giá) và hình ảnh")
    public ResponseEntity<ApiResponse<ProductDetailResponse>> getProductById(@PathVariable Long id) {
        ProductDetailResponse response = productService.getProductById(id);
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin chi tiết sản phẩm thành công!", response));
    }

    @GetMapping("/slug/{slug}")
    @Operation(summary = "Xem chi tiết sản phẩm theo Slug", 
               description = "Lấy chi tiết sản phẩm theo đường dẫn thân thiện SEO (slug)")
    public ResponseEntity<ApiResponse<ProductDetailResponse>> getProductBySlug(@PathVariable String slug) {
        ProductDetailResponse response = productService.getProductBySlug(slug);
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin chi tiết sản phẩm thành công!", response));
    }
}
