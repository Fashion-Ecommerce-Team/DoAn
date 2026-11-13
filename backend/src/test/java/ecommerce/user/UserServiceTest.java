package ecommerce.user;

import ecommerce.common.exception.BadRequestException;
import ecommerce.common.exception.ResourceNotFoundException;
import ecommerce.user.dto.ChangePasswordRequest;
import ecommerce.user.dto.UpdateProfileRequest;
import ecommerce.user.dto.UserProfileResponse;
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
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private UserService userService;

    private User user;

    @BeforeEach
    void setUp() {
        Role role = new Role("ROLE_CUSTOMER", "Customer");
        user = new User("test@example.com", "encodedPassword", "Nguyen Van A", "0987654321", role);
        user.setId(1L);
    }

    @Test
    void getProfile_Success() {
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));

        UserProfileResponse response = userService.getProfile("test@example.com");

        assertNotNull(response);
        assertEquals("test@example.com", response.getEmail());
        assertEquals("Nguyen Van A", response.getFullName());
        assertEquals("0987654321", response.getPhone());
    }

    @Test
    void getProfile_UserNotFound_ThrowsException() {
        when(userRepository.findByEmail("unknown@example.com")).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> userService.getProfile("unknown@example.com"));
    }

    @Test
    void updateProfile_Success() {
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));
        when(userRepository.existsByPhoneAndIdNot("0912345678", 1L)).thenReturn(false);
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UpdateProfileRequest request = UpdateProfileRequest.builder()
                .fullName("Nguyen Van B")
                .phone("0912345678")
                .avatarUrl("https://example.com/avatar.png")
                .build();

        UserProfileResponse response = userService.updateProfile("test@example.com", request);

        assertEquals("Nguyen Van B", response.getFullName());
        assertEquals("0912345678", response.getPhone());
        assertEquals("https://example.com/avatar.png", response.getAvatarUrl());
    }

    @Test
    void updateProfile_DuplicatePhone_ThrowsException() {
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));
        when(userRepository.existsByPhoneAndIdNot("0912345678", 1L)).thenReturn(true);

        UpdateProfileRequest request = UpdateProfileRequest.builder()
                .fullName("Nguyen Van B")
                .phone("0912345678")
                .build();

        assertThrows(BadRequestException.class, () -> userService.updateProfile("test@example.com", request));
    }

    @Test
    void changePassword_Success() {
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("OldPassword123", "encodedPassword")).thenReturn(true);
        when(passwordEncoder.matches("NewPassword123", "encodedPassword")).thenReturn(false);
        when(passwordEncoder.encode("NewPassword123")).thenReturn("newEncodedPassword");

        ChangePasswordRequest request = ChangePasswordRequest.builder()
                .currentPassword("OldPassword123")
                .newPassword("NewPassword123")
                .confirmPassword("NewPassword123")
                .build();

        userService.changePassword("test@example.com", request);

        verify(userRepository).save(user);
        assertEquals("newEncodedPassword", user.getPassword());
    }

    @Test
    void changePassword_MismatchConfirm_ThrowsException() {
        ChangePasswordRequest request = ChangePasswordRequest.builder()
                .currentPassword("OldPassword123")
                .newPassword("NewPassword123")
                .confirmPassword("DifferentPassword")
                .build();

        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));

        assertThrows(BadRequestException.class, () -> userService.changePassword("test@example.com", request));
    }
}
