package ecommerce.user.controller;

import ecommerce.common.response.ApiResponse;
import ecommerce.common.util.SecurityUtils;
import ecommerce.security.CustomUserDetails;
import ecommerce.user.dto.ChangePasswordRequest;
import ecommerce.user.dto.UpdateProfileRequest;
import ecommerce.user.dto.UserProfileResponse;
import ecommerce.user.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/profile")
@Tag(name = "Profile", description = "APIs quản lý thông tin tài khoản cá nhân")
public class ProfileController {

    private final UserService userService;

    public ProfileController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    @Operation(summary = "Lấy thông tin tài khoản cá nhân", description = "Lấy thông tin cá nhân của người dùng đang đăng nhập")
    public ResponseEntity<ApiResponse<UserProfileResponse>> getProfile(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        String email = resolveEmail(userDetails);
        UserProfileResponse response = userService.getProfile(email);
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin tài khoản thành công!", response));
    }

    @PutMapping
    @Operation(summary = "Cập nhật thông tin cá nhân", description = "Cập nhật họ tên, số điện thoại, avatar của người dùng đang đăng nhập")
    public ResponseEntity<ApiResponse<UserProfileResponse>> updateProfile(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody UpdateProfileRequest request) {
        String email = resolveEmail(userDetails);
        UserProfileResponse response = userService.updateProfile(email, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật thông tin cá nhân thành công!", response));
    }

    @PutMapping("/change-password")
    @Operation(summary = "Đổi mật khẩu", description = "Thay đổi mật khẩu đăng nhập của người dùng")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody ChangePasswordRequest request) {
        String email = resolveEmail(userDetails);
        userService.changePassword(email, request);
        return ResponseEntity.ok(ApiResponse.success("Đổi mật khẩu thành công!", null));
    }

    private String resolveEmail(CustomUserDetails userDetails) {
        if (userDetails != null && userDetails.getUsername() != null) {
            return userDetails.getUsername();
        }
        return SecurityUtils.getCurrentUserEmail();
    }
}
