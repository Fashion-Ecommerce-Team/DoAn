package ecommerce.notification;

import ecommerce.common.exception.ResourceNotFoundException;
import ecommerce.common.response.PageResponse;
import ecommerce.notification.dto.NotificationRequest;
import ecommerce.notification.dto.NotificationResponse;
import ecommerce.notification.entity.Notification;
import ecommerce.notification.repository.NotificationRepository;
import ecommerce.notification.service.NotificationService;
import ecommerce.user.entity.Role;
import ecommerce.user.entity.User;
import ecommerce.user.repository.UserRepository;
import ecommerce.user.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock
    private NotificationRepository notificationRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserService userService;

    @InjectMocks
    private NotificationService notificationService;

    private User user;
    private Notification notification;

    @BeforeEach
    void setUp() {
        Role role = new Role("ROLE_CUSTOMER", "Customer");
        user = new User("test@example.com", "pass", "Nguyen Van A", "0987654321", role);
        user.setId(1L);

        notification = Notification.builder()
                .id(100L)
                .user(user)
                .title("Khuyến mãi")
                .message("Giảm giá 20%")
                .type("PROMOTION")
                .isRead(false)
                .build();
    }

    @Test
    void getUserNotifications_ReturnsPageResponse() {
        when(userService.getUserByEmail("test@example.com")).thenReturn(user);
        Page<Notification> page = new PageImpl<>(List.of(notification));
        when(notificationRepository.findByUserIdOrderByCreatedAtDesc(eq(1L), any(Pageable.class))).thenReturn(page);

        PageResponse<NotificationResponse> response = notificationService.getUserNotifications("test@example.com", 0, 10);

        assertNotNull(response);
        assertEquals(1, response.getContent().size());
        assertEquals("Khuyến mãi", response.getContent().get(0).getTitle());
        assertFalse(response.getContent().get(0).getIsRead());
    }

    @Test
    void getUnreadCount_ReturnsCount() {
        when(userService.getUserByEmail("test@example.com")).thenReturn(user);
        when(notificationRepository.countByUserIdAndIsReadFalse(1L)).thenReturn(5L);

        long count = notificationService.getUnreadCount("test@example.com");

        assertEquals(5L, count);
    }

    @Test
    void markAsRead_Success() {
        when(userService.getUserByEmail("test@example.com")).thenReturn(user);
        when(notificationRepository.findByIdAndUserId(100L, 1L)).thenReturn(Optional.of(notification));
        when(notificationRepository.save(any(Notification.class))).thenAnswer(invocation -> invocation.getArgument(0));

        NotificationResponse response = notificationService.markAsRead("test@example.com", 100L);

        assertNotNull(response);
        assertTrue(response.getIsRead());
    }

    @Test
    void markAsRead_NotFound_ThrowsException() {
        when(userService.getUserByEmail("test@example.com")).thenReturn(user);
        when(notificationRepository.findByIdAndUserId(999L, 1L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> notificationService.markAsRead("test@example.com", 999L));
    }

    @Test
    void markAllAsRead_Success() {
        when(userService.getUserByEmail("test@example.com")).thenReturn(user);

        notificationService.markAllAsRead("test@example.com");

        verify(notificationRepository).markAllAsReadByUserId(1L);
    }

    @Test
    void deleteNotification_Success() {
        when(userService.getUserByEmail("test@example.com")).thenReturn(user);
        when(notificationRepository.findByIdAndUserId(100L, 1L)).thenReturn(Optional.of(notification));

        notificationService.deleteNotification("test@example.com", 100L);

        verify(notificationRepository).delete(notification);
    }

    @Test
    void createNotification_Success() {
        NotificationRequest request = NotificationRequest.builder()
                .userId(1L)
                .title("Thông báo mới")
                .message("Chào mừng bạn gia nhập!")
                .type("SYSTEM")
                .build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(notificationRepository.save(any(Notification.class))).thenAnswer(invocation -> {
            Notification n = invocation.getArgument(0);
            n.setId(101L);
            return n;
        });

        NotificationResponse response = notificationService.createNotification(request);

        assertNotNull(response);
        assertEquals(101L, response.getId());
        assertEquals("Thông báo mới", response.getTitle());
    }
}
