package ecommerce.user;

import com.fasterxml.jackson.databind.ObjectMapper;
import ecommerce.user.controller.ProfileController;
import ecommerce.user.dto.ChangePasswordRequest;
import ecommerce.user.dto.UpdateProfileRequest;
import ecommerce.user.dto.UserProfileResponse;
import ecommerce.user.service.UserService;
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

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ProfileController.class)
@AutoConfigureMockMvc(addFilters = false)
class ProfileControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private UserService userService;

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
    void getProfile_Returns200() throws Exception {
        UserProfileResponse response = UserProfileResponse.builder()
                .id(1L)
                .email("user@example.com")
                .fullName("Nguyen Van A")
                .phone("0987654321")
                .role("ROLE_CUSTOMER")
                .build();

        when(userService.getProfile("user@example.com")).thenReturn(response);

        mockMvc.perform(get("/api/v1/profile"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.email").value("user@example.com"))
                .andExpect(jsonPath("$.data.fullName").value("Nguyen Van A"));
    }

    @Test
    void updateProfile_Returns200() throws Exception {
        UpdateProfileRequest request = UpdateProfileRequest.builder()
                .fullName("Nguyen Van B")
                .phone("0912345678")
                .avatarUrl("https://example.com/avatar.jpg")
                .build();

        UserProfileResponse response = UserProfileResponse.builder()
                .id(1L)
                .email("user@example.com")
                .fullName("Nguyen Van B")
                .phone("0912345678")
                .avatarUrl("https://example.com/avatar.jpg")
                .build();

        when(userService.updateProfile(eq("user@example.com"), any(UpdateProfileRequest.class)))
                .thenReturn(response);

        mockMvc.perform(put("/api/v1/profile")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.fullName").value("Nguyen Van B"))
                .andExpect(jsonPath("$.data.phone").value("0912345678"));
    }

    @Test
    void updateProfile_InvalidFullName_Returns400() throws Exception {
        UpdateProfileRequest request = UpdateProfileRequest.builder()
                .fullName("") // Empty fullName
                .phone("0912345678")
                .build();

        mockMvc.perform(put("/api/v1/profile")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void changePassword_Returns200() throws Exception {
        ChangePasswordRequest request = ChangePasswordRequest.builder()
                .currentPassword("OldPass123")
                .newPassword("NewPass123")
                .confirmPassword("NewPass123")
                .build();

        mockMvc.perform(put("/api/v1/profile/change-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Đổi mật khẩu thành công!"));

        verify(userService).changePassword(eq("user@example.com"), any(ChangePasswordRequest.class));
    }
}
