package ecommerce.notification.controller;

import ecommerce.common.response.ApiResponse;
import ecommerce.common.response.PageResponse;
import ecommerce.common.util.SecurityUtils;
import ecommerce.notification.dto.NotificationRequest;
import ecommerce.notification.dto.NotificationResponse;
import ecommerce.notification.service.NotificationService;
import ecommerce.security.CustomUserDetails;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/notifications")
@Tag(name = "Notifications", description = "APIs quản lý thông báo hệ thống và người dùng")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    @Operation(summary = "Lấy danh sách thông báo của người dùng", 
               description = "Lấy danh sách thông báo phân trang, sắp xếp theo thời gian mới nhất")
    public ResponseEntity<ApiResponse<PageResponse<NotificationResponse>>> getUserNotifications(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        String email = resolveEmail(userDetails);
        PageResponse<NotificationResponse> response = notificationService.getUserNotifications(email, page, size);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách thông báo thành công!", response));
    }

    @GetMapping("/unread-count")
    @Operation(summary = "Lấy số lượng thông báo chưa đọc")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getUnreadCount(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        String email = resolveEmail(userDetails);
        long count = notificationService.getUnreadCount(email);
        return ResponseEntity.ok(ApiResponse.success("Lấy số lượng thông báo chưa đọc thành công!", Map.of("unreadCount", count)));
    }

    @PatchMapping("/{id}/read")
    @Operation(summary = "Đánh dấu một thông báo là đã đọc")
    public ResponseEntity<ApiResponse<NotificationResponse>> markAsRead(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        String email = resolveEmail(userDetails);
        NotificationResponse response = notificationService.markAsRead(email, id);
        return ResponseEntity.ok(ApiResponse.success("Đã đánh dấu thông báo là đã đọc!", response));
    }

    @PatchMapping("/read-all")
    @Operation(summary = "Đánh dấu tất cả thông báo là đã đọc")
    public ResponseEntity<ApiResponse<Void>> markAllAsRead(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        String email = resolveEmail(userDetails);
        notificationService.markAllAsRead(email);
        return ResponseEntity.ok(ApiResponse.success("Đã đánh dấu tất cả thông báo là đã đọc!", null));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Xóa thông báo theo ID")
    public ResponseEntity<ApiResponse<Void>> deleteNotification(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        String email = resolveEmail(userDetails);
        notificationService.deleteNotification(email, id);
        return ResponseEntity.ok(ApiResponse.success("Đã xóa thông báo thành công!", null));
    }

    @PostMapping
    @Operation(summary = "Tạo thông báo mới (Hệ thống / Admin)")
    public ResponseEntity<ApiResponse<NotificationResponse>> createNotification(
            @Valid @RequestBody NotificationRequest request) {
        NotificationResponse response = notificationService.createNotification(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo thông báo thành công!", response));
    }

    private String resolveEmail(CustomUserDetails userDetails) {
        if (userDetails != null && userDetails.getUsername() != null) {
            return userDetails.getUsername();
        }
        return SecurityUtils.getCurrentUserEmail();
    }
}
