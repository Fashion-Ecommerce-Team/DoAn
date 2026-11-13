package ecommerce.notification.service;

import ecommerce.common.exception.ResourceNotFoundException;
import ecommerce.common.response.PageResponse;
import ecommerce.notification.dto.NotificationRequest;
import ecommerce.notification.dto.NotificationResponse;
import ecommerce.notification.entity.Notification;
import ecommerce.notification.repository.NotificationRepository;
import ecommerce.user.entity.User;
import ecommerce.user.repository.UserRepository;
import ecommerce.user.service.UserService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final UserService userService;

    public NotificationService(NotificationRepository notificationRepository,
                               UserRepository userRepository,
                               UserService userService) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
        this.userService = userService;
    }

    @Transactional(readOnly = true)
    public PageResponse<NotificationResponse> getUserNotifications(String email, int page, int size) {
        User user = userService.getUserByEmail(email);

        int pageNo = Math.max(page, 0);
        int pageSize = (size > 0 && size <= 100) ? size : 10;
        Pageable pageable = PageRequest.of(pageNo, pageSize);

        Page<Notification> notifPage = notificationRepository.findByUserIdOrderByCreatedAtDesc(user.getId(), pageable);

        List<NotificationResponse> content = notifPage.getContent().stream()
                .map(NotificationResponse::fromEntity)
                .toList();

        return PageResponse.<NotificationResponse>builder()
                .content(content)
                .pageNo(notifPage.getNumber())
                .pageSize(notifPage.getSize())
                .totalElements(notifPage.getTotalElements())
                .totalPages(notifPage.getTotalPages())
                .last(notifPage.isLast())
                .build();
    }

    @Transactional(readOnly = true)
    public long getUnreadCount(String email) {
        User user = userService.getUserByEmail(email);
        return notificationRepository.countByUserIdAndIsReadFalse(user.getId());
    }

    @Transactional
    public NotificationResponse markAsRead(String email, Long notificationId) {
        User user = userService.getUserByEmail(email);

        Notification notification = notificationRepository.findByIdAndUserId(notificationId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông báo với ID: " + notificationId));

        notification.setIsRead(true);
        Notification updated = notificationRepository.save(notification);
        return NotificationResponse.fromEntity(updated);
    }

    @Transactional
    public void markAllAsRead(String email) {
        User user = userService.getUserByEmail(email);
        notificationRepository.markAllAsReadByUserId(user.getId());
    }

    @Transactional
    public void deleteNotification(String email, Long notificationId) {
        User user = userService.getUserByEmail(email);

        Notification notification = notificationRepository.findByIdAndUserId(notificationId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông báo với ID: " + notificationId));

        notificationRepository.delete(notification);
    }

    @Transactional
    public NotificationResponse createNotification(NotificationRequest request) {
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng với ID: " + request.getUserId()));

        Notification notification = Notification.builder()
                .user(user)
                .title(request.getTitle().trim())
                .message(request.getMessage().trim())
                .type(request.getType() != null ? request.getType().trim() : "SYSTEM")
                .isRead(false)
                .build();

        Notification saved = notificationRepository.save(notification);
        return NotificationResponse.fromEntity(saved);
    }
}
