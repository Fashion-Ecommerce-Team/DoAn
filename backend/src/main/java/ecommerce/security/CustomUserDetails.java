package ecommerce.security;

import ecommerce.user.entity.User;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.Collections;

public class CustomUserDetails implements UserDetails {

    private final User user;

    public CustomUserDetails(User user) {
        this.user = user;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        String roleName = "ROLE_CUSTOMER";
        if (user.getRole() != null) {
            Long roleId = user.getRole().getId();
            String rawName = user.getRole().getName() != null ? user.getRole().getName().trim().toUpperCase() : "";
            if ((roleId != null && roleId == 1L) || rawName.contains("ADMIN")) {
                roleName = "ROLE_ADMIN";
            } else if (!rawName.isEmpty()) {
                roleName = rawName.startsWith("ROLE_") ? rawName : "ROLE_" + rawName;
            }
        }
        return Collections.singletonList(new SimpleGrantedAuthority(roleName));
    }

    @Override
    public String getPassword() {
        return user.getPassword();
    }

    @Override
    public String getUsername() {
        return user.getEmail();
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return !"BLOCKED".equalsIgnoreCase(user.getStatus());
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return "ACTIVE".equalsIgnoreCase(user.getStatus());
    }

    public User getUser() {
        return user;
    }

    public Long getUserId() {
        return user.getId();
    }
}
