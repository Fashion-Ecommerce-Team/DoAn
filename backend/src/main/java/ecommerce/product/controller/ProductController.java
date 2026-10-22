package ecommerce.product.controller;

import ecommerce.common.response.ApiResponse;
import ecommerce.common.response.PageResponse;
import ecommerce.common.util.SecurityUtils;
import ecommerce.product.dto.ProductDetailResponse;
import ecommerce.product.dto.ProductFilterRequest;
import ecommerce.product.dto.ProductSummaryResponse;
import ecommerce.product.service.FashionClipService;
import ecommerce.product.service.ProductService;
import ecommerce.security.CustomUserDetails;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/products")
@Tag(name = "Products", description = "APIs khám phá, tìm kiếm và chi tiết sản phẩm")
public class ProductController {

    private final ProductService productService;
    private final FashionClipService fashionClipService;

    public ProductController(ProductService productService, FashionClipService fashionClipService) {
        this.productService = productService;
        this.fashionClipService = fashionClipService;
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

    @PostMapping(value = "/search/image")
    @Operation(summary = "Tìm kiếm sản phẩm bằng hình ảnh (Fashion-CLIP)", 
               description = "Tải lên ảnh hoặc truyền imageUrl để tìm kiếm sản phẩm tương tự bằng Fashion-CLIP")
    public ResponseEntity<ApiResponse<PageResponse<ProductSummaryResponse>>> searchByImage(
            @RequestParam(value = "file", required = false) MultipartFile file,
            @RequestParam(value = "imageUrl", required = false) String imageUrl,
            @ModelAttribute ProductFilterRequest filter,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        String email = resolveEmail(userDetails);
        PageResponse<ProductSummaryResponse> response = fashionClipService.searchByImage(file, imageUrl, filter, email);
        return ResponseEntity.ok(ApiResponse.success("Tìm kiếm sản phẩm theo hình ảnh thành công!", response));
    }

    @PostMapping(value = "/search/hybrid")
    @Operation(summary = "Tìm kiếm đa phương thức kết hợp hình ảnh và văn bản (Fashion-CLIP Hybrid)", 
               description = "Kết hợp hình ảnh và từ khóa văn bản (ví dụ: tìm kiểu áo giống ảnh nhưng màu đen) để tìm kiếm chính xác")
    public ResponseEntity<ApiResponse<PageResponse<ProductSummaryResponse>>> searchHybrid(
            @RequestParam(value = "file", required = false) MultipartFile file,
            @RequestParam(value = "imageUrl", required = false) String imageUrl,
            @RequestParam(value = "keyword", required = false) String keyword,
            @RequestParam(value = "imageWeight", required = false, defaultValue = "0.6") Double imageWeight,
            @ModelAttribute ProductFilterRequest filter,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        String email = resolveEmail(userDetails);
        PageResponse<ProductSummaryResponse> response = fashionClipService.searchHybrid(file, imageUrl, keyword, imageWeight, filter, email);
        return ResponseEntity.ok(ApiResponse.success("Tìm kiếm sản phẩm đa phương thức (Hybrid) thành công!", response));
    }

    @PostMapping("/search/sync-ai")
    @Operation(summary = "Đồng bộ danh mục sản phẩm vào vector index của Fashion-CLIP")
    public ResponseEntity<ApiResponse<Map<String, Object>>> syncAiCatalog() {
        int count = fashionClipService.syncCatalog();
        return ResponseEntity.ok(ApiResponse.success("Đồng bộ danh mục vào Fashion-CLIP thành công!", Map.of("syncedProducts", count)));
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

    private String resolveEmail(CustomUserDetails userDetails) {
        if (userDetails != null && userDetails.getUsername() != null) {
            return userDetails.getUsername();
        }
        return SecurityUtils.getCurrentUserEmail();
    }
}
