
package ecommerce.payment.controller;
import ecommerce.payment.dto.CreateQrRequest;
import ecommerce.common.response.ApiResponse;
import ecommerce.payment.dto.CreatePaymentRequest;
import ecommerce.payment.service.PaymentService;
import ecommerce.security.CustomUserDetails;
import jakarta.validation.Valid;
import ecommerce.payment.dto.PaymentCallbackRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.RequestHeader;
import java.security.MessageDigest;
import java.nio.charset.StandardCharsets;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/payments")
public class PaymentController {

    private final PaymentService paymentService;
@Value("${payment.callback.secret:}")
private String callbackSecret;
    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    // API 1: Tạo bản ghi thanh toán
    @PostMapping("/create")
    public ResponseEntity<ApiResponse<Map<String, Object>>> createPayment(
            @AuthenticationPrincipal CustomUserDetails currentUser,
            @Valid @RequestBody CreatePaymentRequest request) {

        Map<String, Object> result = paymentService.createPayment(
                currentUser.getUserId(),
                request.getOrderId(),
                request.getPaymentMethod());

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Tạo giao dịch thanh toán thành công",
                        result));
    }

    // API 2: Lấy chi tiết giao dịch
    @GetMapping("/{paymentId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getPaymentDetail(
            @AuthenticationPrincipal CustomUserDetails currentUser,
            @PathVariable Long paymentId) {

        Map<String, Object> result = paymentService.getPaymentDetail(
                currentUser.getUserId(),
                paymentId);

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Lấy chi tiết giao dịch thanh toán thành công",
                        result));
    }

    // API 3: Kiểm tra trạng thái thanh toán
    @GetMapping("/{paymentId}/status")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getPaymentStatus(
            @AuthenticationPrincipal CustomUserDetails currentUser,
            @PathVariable Long paymentId) {

        Map<String, Object> result = paymentService.getPaymentStatus(
                currentUser.getUserId(),
                paymentId);

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Lấy trạng thái thanh toán thành công",
                        result));
    }
    
    // API 4: Tạo thông tin thanh toán QR
    @PostMapping("/qr")
    public ResponseEntity<ApiResponse<Map<String, Object>>> createQrPayment(
            @AuthenticationPrincipal CustomUserDetails currentUser,
            @Valid @RequestBody CreateQrRequest request) {

        Map<String, Object> result = paymentService.createQrPayment(
                currentUser.getUserId(),
                request.getPaymentId());

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Tạo thông tin thanh toán QR thành công",
                        result));
    }
// API 5: Nhận kết quả thanh toán từ callback
@PostMapping("/callback")
public ResponseEntity<ApiResponse<Map<String, Object>>> paymentCallback(
        @RequestHeader(
                value = "X-Payment-Callback-Secret",
                required = false
        ) String requestSecret,
        @Valid @RequestBody PaymentCallbackRequest request) {

    if (callbackSecret == null || callbackSecret.isBlank()) {
        throw new org.springframework.web.server.ResponseStatusException(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "Chưa cấu hình PAYMENT_CALLBACK_SECRET");
    }

    if (requestSecret == null
            || !MessageDigest.isEqual(
                    callbackSecret.getBytes(StandardCharsets.UTF_8),
                    requestSecret.getBytes(StandardCharsets.UTF_8))) {
        throw new org.springframework.web.server.ResponseStatusException(
                HttpStatus.UNAUTHORIZED,
                "Callback secret không hợp lệ");
    }

    Map<String, Object> result =
            paymentService.handlePaymentCallback(
                    request.getPaymentId(),
                    request.getTransactionId(),
                    request.getPaymentStatus());

    return ResponseEntity.ok(
            ApiResponse.success(
                    "Cập nhật kết quả thanh toán thành công",
                    result));
}
}
