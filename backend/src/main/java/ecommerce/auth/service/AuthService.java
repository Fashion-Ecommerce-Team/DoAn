package ecommerce.auth.service;

import ecommerce.auth.dto.*;
import ecommerce.common.exception.BadRequestException;
import ecommerce.security.CustomUserDetails;
import ecommerce.security.JwtTokenProvider;
import ecommerce.user.entity.Role;
import ecommerce.user.entity.User;
import ecommerce.user.repository.RoleRepository;
import ecommerce.user.repository.UserRepository;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class AuthService {

    private static final int OTP_EXPIRY_SECONDS = 300; // 5 phút
    private static final SecureRandom RANDOM = new SecureRandom();

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;
    private final EmailService emailService;

    // Lưu trữ tạm thời phiên đăng ký chờ xác thực OTP và phiên quên mật khẩu
    private final Map<String, PendingRegistration> pendingRegistrations = new ConcurrentHashMap<>();
    private final Map<String, OtpSession> passwordResetOtps = new ConcurrentHashMap<>();

    private record PendingRegistration(
            String fullName,
            String email,
            String phone,
            String encodedPassword,
            String otp,
            long expiresAt
    ) {}

    private record OtpSession(
            String email,
            String otp,
            long expiresAt
    ) {}

    public AuthService(UserRepository userRepository,
                       RoleRepository roleRepository,
                       PasswordEncoder passwordEncoder,
                       AuthenticationManager authenticationManager,
                       JwtTokenProvider tokenProvider,
                       EmailService emailService) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.tokenProvider = tokenProvider;
        this.emailService = emailService;
    }

    private String generateSixDigitOtp() {
        int code = 100000 + RANDOM.nextInt(900000);
        return String.valueOf(code);
    }

    /**
     * Bước 1 Đăng ký: Kiểm tra thông tin hợp lệ và gửi mã xác thực OTP 6 chữ số về Email.
     */
    @Transactional(readOnly = true)
    public OtpResponse sendRegisterOtp(RegisterRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        String phone = request.getPhone() != null ? request.getPhone().trim() : null;

        if (userRepository.existsByEmail(email)) {
            throw new BadRequestException("Email đã được sử dụng, vui lòng chọn email khác!");
        }

        if (phone != null && !phone.isEmpty() && userRepository.existsByPhone(phone)) {
            throw new BadRequestException("Số điện thoại đã được sử dụng, vui lòng chọn số khác!");
        }

        String otp = generateSixDigitOtp();
        long expiresAt = System.currentTimeMillis() + (OTP_EXPIRY_SECONDS * 1000L);

        pendingRegistrations.put(email, new PendingRegistration(
                request.getFullName().trim(),
                email,
                phone,
                passwordEncoder.encode(request.getPassword()),
                otp,
                expiresAt
        ));

        boolean mailSent = emailService.sendOtpEmail(
                email,
                request.getFullName().trim(),
                otp,
                "Xác Thực Đăng Ký Tài Khoản"
        );

        return new OtpResponse(email, OTP_EXPIRY_SECONDS, mailSent, mailSent ? null : otp);
    }

    /**
     * Bước 2 Đăng ký: Xác thực mã OTP và lưu tài khoản chính thức vào Database.
     */
    @Transactional
    public String verifyRegisterOtp(VerifyOtpRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        String otp = request.getOtp().trim();

        PendingRegistration pending = pendingRegistrations.get(email);
        if (pending == null) {
            throw new BadRequestException("Không tìm thấy yêu cầu đăng ký cho email này. Vui lòng nhận lại mã OTP!");
        }

        if (System.currentTimeMillis() > pending.expiresAt()) {
            pendingRegistrations.remove(email);
            throw new BadRequestException("Mã xác thực OTP đã hết hạn (quá 5 phút). Vui lòng nhấn Gửi lại mã!");
        }

        if (!pending.otp().equals(otp)) {
            throw new BadRequestException("Mã xác thực OTP không chính xác. Vui lòng kiểm tra lại!");
        }

        if (userRepository.existsByEmail(email)) {
            pendingRegistrations.remove(email);
            throw new BadRequestException("Tài khoản với email này đã được kích hoạt trước đó!");
        }

        Role customerRole = roleRepository.findByName("ROLE_CUSTOMER")
                .or(() -> roleRepository.findByName("CUSTOMER"))
                .or(() -> roleRepository.findByName("USER"))
                .orElseGet(() -> {
                    Role newRole = new Role("ROLE_CUSTOMER", "Khách hàng mua sắm");
                    return roleRepository.save(newRole);
                });

        User user = new User(
                pending.email(),
                pending.encodedPassword(),
                pending.fullName(),
                pending.phone(),
                customerRole
        );
        user.setEmailVerified(true);
        userRepository.save(user);

        pendingRegistrations.remove(email);
        return "Xác thực OTP và đăng ký tài khoản thành công!";
    }

    /**
     * Giữ tương thích ngược cho endpoint POST /register cũ.
     */
    @Transactional
    public String register(RegisterRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        if (userRepository.existsByEmail(email)) {
            throw new BadRequestException("Email đã được sử dụng, vui lòng chọn email khác!");
        }

        if (request.getPhone() != null && userRepository.existsByPhone(request.getPhone().trim())) {
            throw new BadRequestException("Số điện thoại đã được sử dụng, vui lòng chọn số khác!");
        }
        Role customerRole = roleRepository.findByName("ROLE_CUSTOMER")
                .or(() -> roleRepository.findByName("CUSTOMER"))
                .or(() -> roleRepository.findByName("USER"))
                .orElseGet(() -> {
                    Role newRole = new Role("ROLE_CUSTOMER", "Khách hàng mua sắm");
                    return roleRepository.save(newRole);
                });

        User user = new User(
                email,
                passwordEncoder.encode(request.getPassword()),
                request.getFullName().trim(),
                request.getPhone() != null ? request.getPhone().trim() : null,
                customerRole);

        userRepository.save(user);
        return "Đăng ký tài khoản thành công!";
    }

    /**
     * Quên mật khẩu - Bước 1: Kiểm tra email tồn tại và gửi mã OTP khôi phục mật khẩu.
     */
    @Transactional(readOnly = true)
    public OtpResponse sendForgotPasswordOtp(ForgotPasswordRequest request) {
        String email = request.getEmail().trim().toLowerCase();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BadRequestException("Không tìm thấy tài khoản nào đăng ký với địa chỉ email này!"));

        String otp = generateSixDigitOtp();
        long expiresAt = System.currentTimeMillis() + (OTP_EXPIRY_SECONDS * 1000L);

        passwordResetOtps.put(email, new OtpSession(email, otp, expiresAt));

        boolean mailSent = emailService.sendOtpEmail(
                email,
                user.getFullName(),
                otp,
                "Khôi Phục Mật Khẩu Tài Khoản"
        );

        return new OtpResponse(email, OTP_EXPIRY_SECONDS, mailSent, mailSent ? null : otp);
    }

    /**
     * Quên mật khẩu - Bước 2: Xác thực mã OTP và cập nhật mật khẩu mới.
     */
    @Transactional
    public String resetPasswordWithOtp(ResetPasswordRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        String otp = request.getOtp().trim();

        OtpSession session = passwordResetOtps.get(email);
        if (session == null) {
            throw new BadRequestException("Chưa có yêu cầu đặt lại mật khẩu cho email này hoặc phiên đã hết hạn!");
        }

        if (System.currentTimeMillis() > session.expiresAt()) {
            passwordResetOtps.remove(email);
            throw new BadRequestException("Mã xác thực OTP đã hết hạn (quá 5 phút). Vui lòng nhận mã mới!");
        }

        if (!session.otp().equals(otp)) {
            throw new BadRequestException("Mã xác thực OTP không chính xác!");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BadRequestException("Không tìm thấy tài khoản người dùng!"));

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        passwordResetOtps.remove(email);
        return "Đặt lại mật khẩu mới thành công! Vui lòng đăng nhập lại.";
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        String email = request.getEmail() != null ? request.getEmail().trim() : "";
        String rawPassword = request.getPassword() != null ? request.getPassword() : "";

        // Hỗ trợ tự động mã hóa BCrypt nếu tài khoản được thêm thủ công bằng SQL (mật khẩu dạng plain-text)
        userRepository.findByEmail(email).ifPresent(existingUser -> {
            String storedPwd = existingUser.getPassword();
            if (storedPwd != null
                    && !storedPwd.startsWith("$2a$")
                    && !storedPwd.startsWith("$2b$")
                    && !storedPwd.startsWith("$2y$")
                    && storedPwd.equals(rawPassword)) {
                existingUser.setPassword(passwordEncoder.encode(rawPassword));
                userRepository.save(existingUser);
            }
        });

        Authentication authentication;
        try {
            authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(email, rawPassword));
        } catch (org.springframework.security.core.AuthenticationException ex) {
            throw new BadRequestException("Email hoặc mật khẩu không chính xác!");
        }

        SecurityContextHolder.getContext().setAuthentication(authentication);

        String jwt = tokenProvider.generateToken(authentication);

        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        User user = userDetails.getUser();

        String roleName = "ROLE_CUSTOMER";
        if (user.getRole() != null && user.getRole().getName() != null) {
            String rawName = user.getRole().getName().trim().toUpperCase();
            if (rawName.contains("ADMIN")) {
                roleName = "ROLE_ADMIN";
            }
        }

        return new AuthResponse(
                jwt,
                user.getId(),
                user.getEmail(),
                user.getFullName(),
                roleName);
    }
}
