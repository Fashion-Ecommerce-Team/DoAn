package ecommerce.auth.controller;

import ecommerce.auth.dto.*;
import ecommerce.auth.service.AuthService;
import ecommerce.common.response.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {
    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<String>> register(@Valid @RequestBody RegisterRequest request) {
        String message = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(message, null));
    }

    @PostMapping("/register/send-otp")
    public ResponseEntity<ApiResponse<OtpResponse>> sendRegisterOtp(@Valid @RequestBody RegisterRequest request) {
        OtpResponse response = authService.sendRegisterOtp(request);
        String msg = response.isMailSent()
                ? "Mã xác thực OTP đã được gửi tới email của bạn!"
                : "Đã khởi tạo mã xác thực OTP (Chế độ Local/Dev)!";
        return ResponseEntity.ok(ApiResponse.success(msg, response));
    }

    @PostMapping("/register/verify-otp")
    public ResponseEntity<ApiResponse<String>> verifyRegisterOtp(@Valid @RequestBody VerifyOtpRequest request) {
        String message = authService.verifyRegisterOtp(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(message, null));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<OtpResponse>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        OtpResponse response = authService.sendForgotPasswordOtp(request);
        String msg = response.isMailSent()
                ? "Mã OTP khôi phục mật khẩu đã được gửi tới email của bạn!"
                : "Đã khởi tạo mã OTP khôi phục mật khẩu (Chế độ Local/Dev)!";
        return ResponseEntity.ok(ApiResponse.success(msg, response));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<String>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        String message = authService.resetPasswordWithOtp(request);
        return ResponseEntity.ok(ApiResponse.success(message, null));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success("Đăng nhập thành công!", response));
    }
}
