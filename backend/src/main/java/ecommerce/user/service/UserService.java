package ecommerce.user.service;

import ecommerce.common.exception.BadRequestException;
import ecommerce.common.exception.ResourceNotFoundException;
import ecommerce.user.dto.ChangePasswordRequest;
import ecommerce.user.dto.UpdateProfileRequest;
import ecommerce.user.dto.UserProfileResponse;
import ecommerce.user.entity.User;
import ecommerce.user.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public UserProfileResponse getProfile(String email) {
        User user = getUserByEmail(email);
        return UserProfileResponse.fromEntity(user);
    }

    @Transactional
    public UserProfileResponse updateProfile(String email, UpdateProfileRequest request) {
        User user = getUserByEmail(email);

        String newPhone = (request.getPhone() != null && !request.getPhone().isBlank())
                ? request.getPhone().trim()
                : null;

        if (newPhone != null && !newPhone.equals(user.getPhone())) {
            if (userRepository.existsByPhoneAndIdNot(newPhone, user.getId())) {
                throw new BadRequestException("Số điện thoại đã được sử dụng bởi tài khoản khác!");
            }
        }

        user.setFullName(request.getFullName().trim());
        user.setPhone(newPhone);
        if (request.getAvatarUrl() != null) {
            user.setAvatarUrl(request.getAvatarUrl().trim().isEmpty() ? null : request.getAvatarUrl().trim());
        }

        User updatedUser = userRepository.save(user);
        return UserProfileResponse.fromEntity(updatedUser);
    }

    @Transactional
    public void changePassword(String email, ChangePasswordRequest request) {
        User user = getUserByEmail(email);

        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new BadRequestException("Mật khẩu xác nhận không khớp!");
        }

        if (user.getPassword() == null) {
            throw new BadRequestException("Tài khoản này được đăng nhập qua mạng xã hội, không sử dụng mật khẩu thường!");
        }

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new BadRequestException("Mật khẩu hiện tại không chính xác!");
        }

        if (passwordEncoder.matches(request.getNewPassword(), user.getPassword())) {
            throw new BadRequestException("Mật khẩu mới không được trùng với mật khẩu cũ!");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    public User getUserByEmail(String email) {
        if (email == null || email.isBlank()) {
            throw new BadRequestException("Thông tin xác thực không hợp lệ!");
        }
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông tin người dùng!"));
    }
}
