package ecommerce.auth.service;

import ecommerce.auth.dto.AuthResponse;
import ecommerce.auth.dto.LoginRequest;
import ecommerce.auth.dto.RegisterRequest;
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

import java.time.LocalDateTime;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;

    public AuthService(UserRepository userRepository,
            RoleRepository roleRepository,
            PasswordEncoder passwordEncoder,
            AuthenticationManager authenticationManager,
            JwtTokenProvider tokenProvider) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.tokenProvider = tokenProvider;
    }

    @Transactional
    public String register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email đã được sử dụng, vui lòng chọn email khác!");
        }
        Role customerRole = roleRepository.findByName("ROLE_CUSTOMER")
                .orElseGet(() -> {
                    Role newRole = new Role("ROLE_CUSTOMER", "Khách hàng mua sắm");
                    return roleRepository.save(newRole);
                });

        User user = new User(
                request.getEmail(),
                passwordEncoder.encode(request.getPassword()), // Băm mật khẩu an toàn
                request.getFullName(),
                request.getPhone(),
                customerRole);

        userRepository.save(user);

        return "Đăng ký tài khoản thành công!";
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));

        SecurityContextHolder.getContext().setAuthentication(authentication);

        String jwt = tokenProvider.generateToken(authentication);

        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        User user = userDetails.getUser();

        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);

        String roleName = (user.getRole() != null) ? user.getRole().getName() : "ROLE_CUSTOMER";

        return new AuthResponse(
                jwt,
                user.getId(),
                user.getEmail(),
                user.getFullName(),
                roleName);
    }
}
