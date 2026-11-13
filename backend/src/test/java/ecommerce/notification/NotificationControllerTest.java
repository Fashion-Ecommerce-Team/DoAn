package ecommerce.notification;

import com.fasterxml.jackson.databind.ObjectMapper;
import ecommerce.common.response.PageResponse;
import ecommerce.notification.controller.NotificationController;
import ecommerce.notification.dto.NotificationRequest;
import ecommerce.notification.dto.NotificationResponse;
import ecommerce.notification.service.NotificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(NotificationController.class)
@AutoConfigureMockMvc(addFilters = false)
class NotificationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private NotificationService notificationService;

    @MockBean
    private ecommerce.security.JwtTokenProvider jwtTokenProvider;

    @MockBean
    private ecommerce.security.CustomUserDetailsService customUserDetailsService;

    @BeforeEach
    void setUp() {
        UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken("user@example.com", null, null);
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @Test
    void getUserNotifications_Returns200() throws Exception {
        NotificationResponse notif = NotificationResponse.builder()
                .id(1L)
                .title("Thông báo đơn hàng")
                .message("Đơn hàng của bạn đang được giao")
                .type("ORDER")
                .isRead(false)
                .build();

        PageResponse<NotificationResponse> pageResponse = PageResponse.<NotificationResponse>builder()
                .content(List.of(notif))
                .pageNo(0)
                .pageSize(10)
                .totalElements(1)
                .totalPages(1)
                .last(true)
                .build();

        when(notificationService.getUserNotifications("user@example.com", 0, 10)).thenReturn(pageResponse);

        mockMvc.perform(get("/api/v1/notifications"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content[0].title").value("Thông báo đơn hàng"));
    }

    @Test
    void getUnreadCount_Returns200() throws Exception {
        when(notificationService.getUnreadCount("user@example.com")).thenReturn(3L);

        mockMvc.perform(get("/api/v1/notifications/unread-count"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.unreadCount").value(3));
    }

    @Test
    void markAsRead_Returns200() throws Exception {
        NotificationResponse updated = NotificationResponse.builder()
                .id(1L)
                .title("Thông báo đơn hàng")
                .isRead(true)
                .build();

        when(notificationService.markAsRead("user@example.com", 1L)).thenReturn(updated);

        mockMvc.perform(patch("/api/v1/notifications/1/read"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.isRead").value(true));
    }

    @Test
    void markAllAsRead_Returns200() throws Exception {
        mockMvc.perform(patch("/api/v1/notifications/read-all"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Đã đánh dấu tất cả thông báo là đã đọc!"));

        verify(notificationService).markAllAsRead("user@example.com");
    }

    @Test
    void deleteNotification_Returns200() throws Exception {
        mockMvc.perform(delete("/api/v1/notifications/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Đã xóa thông báo thành công!"));

        verify(notificationService).deleteNotification("user@example.com", 1L);
    }

    @Test
    void createNotification_Returns201() throws Exception {
        NotificationRequest request = NotificationRequest.builder()
                .userId(1L)
                .title("Khuyến mãi mới")
                .message("Flash sale hôm nay")
                .type("PROMOTION")
                .build();

        NotificationResponse response = NotificationResponse.builder()
                .id(10L)
                .title("Khuyến mãi mới")
                .build();

        when(notificationService.createNotification(any(NotificationRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/v1/notifications")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.title").value("Khuyến mãi mới"));
    }
}
