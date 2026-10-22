package ecommerce.wishlist.controller;

import ecommerce.common.response.ApiResponse;
import ecommerce.common.response.PageResponse;
import ecommerce.common.util.SecurityUtils;
import ecommerce.security.CustomUserDetails;
import ecommerce.wishlist.dto.WishlistItemResponse;
import ecommerce.wishlist.dto.WishlistRequest;
import ecommerce.wishlist.service.WishlistService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/wishlists")
@Tag(name = "Wishlists", description = "APIs quản lý danh sách sản phẩm yêu thích")
public class WishlistController {

    private final WishlistService wishlistService;

    public WishlistController(WishlistService wishlistService) {
        this.wishlistService = wishlistService;
    }

    @GetMapping
    @Operation(summary = "Lấy danh sách sản phẩm yêu thích (có phân trang)", 
               description = "Lấy danh sách các sản phẩm yêu thích của người dùng đang đăng nhập")
    public ResponseEntity<ApiResponse<PageResponse<WishlistItemResponse>>> getWishlist(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        String email = resolveEmail(userDetails);
        PageResponse<WishlistItemResponse> response = wishlistService.getWishlist(email, page, size);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách yêu thích thành công!", response));
    }

    @PostMapping
    @Operation(summary = "Thêm sản phẩm vào danh sách yêu thích", 
               description = "Thêm một sản phẩm theo ID vào danh sách yêu thích của người dùng")
    public ResponseEntity<ApiResponse<WishlistItemResponse>> addToWishlist(
            @Valid @RequestBody WishlistRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        String email = resolveEmail(userDetails);
        WishlistItemResponse response = wishlistService.addToWishlist(email, request.getProductId());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Đã thêm sản phẩm vào danh sách yêu thích!", response));
    }

    @DeleteMapping("/{productId}")
    @Operation(summary = "Xóa sản phẩm khỏi danh sách yêu thích", 
               description = "Xóa một sản phẩm theo ID khỏi danh sách yêu thích của người dùng")
    public ResponseEntity<ApiResponse<Void>> removeFromWishlist(
            @PathVariable Long productId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        String email = resolveEmail(userDetails);
        wishlistService.removeFromWishlist(email, productId);
        return ResponseEntity.ok(ApiResponse.success("Đã xóa sản phẩm khỏi danh sách yêu thích!", null));
    }

    @GetMapping("/check/{productId}")
    @Operation(summary = "Kiểm tra sản phẩm có trong danh sách yêu thích hay không")
    public ResponseEntity<ApiResponse<Map<String, Boolean>>> checkWishlist(
            @PathVariable Long productId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        String email = resolveEmail(userDetails);
        boolean inWishlist = wishlistService.isInWishlist(email, productId);
        return ResponseEntity.ok(ApiResponse.success("Kiểm tra thành công!", Map.of("inWishlist", inWishlist)));
    }

    private String resolveEmail(CustomUserDetails userDetails) {
        if (userDetails != null && userDetails.getUsername() != null) {
            return userDetails.getUsername();
        }
        return SecurityUtils.getCurrentUserEmail();
    }
}
