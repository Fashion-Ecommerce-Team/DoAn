
package ecommerce.checkout.controller;

import ecommerce.checkout.dto.CheckoutPreviewResponse;
import ecommerce.checkout.dto.CheckoutValidateRequest;
import ecommerce.checkout.service.CheckoutService;
import ecommerce.common.response.ApiResponse;
import ecommerce.security.CustomUserDetails;

import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.List;

@RestController
@RequestMapping("/api/v1/checkout")
public class CheckoutController {

    private final CheckoutService checkoutService;

    public CheckoutController(CheckoutService checkoutService) {
        this.checkoutService = checkoutService;
    }

    @PostMapping("/preview")
    public ResponseEntity<ApiResponse<CheckoutPreviewResponse>> preview(
            @AuthenticationPrincipal CustomUserDetails currentUser) {

        CheckoutPreviewResponse result =
                checkoutService.preview(currentUser.getUserId());

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Tính toán đơn hàng thành công",
                        result));
    }

    @PostMapping("/validate")
    public ResponseEntity<ApiResponse<Map<String, Object>>> validate(
            @AuthenticationPrincipal CustomUserDetails currentUser,
            @Valid @RequestBody CheckoutValidateRequest request) {

        Map<String, Object> result =
                checkoutService.validate(
                        currentUser.getUserId(),
                        request);

        String message = String.valueOf(result.get("message"));

        return ResponseEntity.ok(
                ApiResponse.success(message, result));
    }
    
@GetMapping("/addresses")
public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getAddresses(
        @AuthenticationPrincipal CustomUserDetails currentUser) {

    List<Map<String, Object>> addresses =
            checkoutService.getAddresses(currentUser.getUserId());

    return ResponseEntity.ok(
            ApiResponse.success(
                    "Lấy danh sách địa chỉ thành công",
                    addresses));
}

}
