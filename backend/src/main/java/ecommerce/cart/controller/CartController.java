
package ecommerce.cart.controller;

import ecommerce.cart.dto.AddCartItemRequest;
import ecommerce.cart.dto.CartItemResponse;
import ecommerce.cart.dto.UpdateCartItemRequest;
import ecommerce.cart.service.CartService;
import ecommerce.common.response.ApiResponse;
import ecommerce.security.CustomUserDetails;

import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/cart")
public class CartController {

    private final CartService cartService;

    public CartController(CartService cartService) {
        this.cartService = cartService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<CartItemResponse>>> getCart(
            @AuthenticationPrincipal CustomUserDetails currentUser) {

        List<CartItemResponse> cart =
                cartService.getCart(currentUser.getUserId());

        return ResponseEntity.ok(
                ApiResponse.success("Lấy giỏ hàng thành công", cart));
    }

    @GetMapping("/count")
    public ResponseEntity<ApiResponse<Long>> getCartCount(
            @AuthenticationPrincipal CustomUserDetails currentUser) {

        long count = cartService.getCartCount(currentUser.getUserId());

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Lấy số lượng sản phẩm trong giỏ thành công",
                        count));
    }

    @PostMapping("/items")
    public ResponseEntity<ApiResponse<CartItemResponse>> addItem(
            @AuthenticationPrincipal CustomUserDetails currentUser,
            @Valid @RequestBody AddCartItemRequest request) {

        CartItemResponse response =
                cartService.addItem(currentUser.getUserId(), request);

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Thêm sản phẩm vào giỏ hàng thành công",
                        response));
    }

    @PutMapping("/items/{itemId}")
    public ResponseEntity<ApiResponse<CartItemResponse>> updateItem(
            @AuthenticationPrincipal CustomUserDetails currentUser,
            @PathVariable Long itemId,
            @Valid @RequestBody UpdateCartItemRequest request) {

        CartItemResponse response = cartService.updateItem(
                currentUser.getUserId(), itemId, request);

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Cập nhật sản phẩm trong giỏ hàng thành công",
                        response));
    }

    @DeleteMapping("/items")
    public ResponseEntity<ApiResponse<Void>> deleteItem(
            @AuthenticationPrincipal CustomUserDetails currentUser,
            @RequestParam Long productVariantId) {

        cartService.deleteItem(
                currentUser.getUserId(), productVariantId);

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Xóa sản phẩm khỏi giỏ hàng thành công",
                        null));
    }

    @DeleteMapping("/clear")
    public ResponseEntity<ApiResponse<Void>> clearCart(
            @AuthenticationPrincipal CustomUserDetails currentUser) {

        cartService.clearCart(currentUser.getUserId());

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Xóa toàn bộ giỏ hàng thành công",
                        null));
    }

    @PostMapping("/validate")
    public ResponseEntity<ApiResponse<Map<String, Object>>> validateCart(
            @AuthenticationPrincipal CustomUserDetails currentUser) {

        Map<String, Object> result =
                cartService.validateCart(currentUser.getUserId());

        boolean valid = Boolean.TRUE.equals(result.get("valid"));
        String message = String.valueOf(result.get("message"));

        return ResponseEntity.ok(ApiResponse.success(message, result));
    }
}
