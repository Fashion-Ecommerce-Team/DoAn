package ecommerce.admin.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

@Entity(name = "AdminUser")
@Table(name = "users")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String email;
    private String password;
    @Column(name = "full_name")
    private String fullName;
    private String phone;
    @Column(name = "avatar_url")
    private String avatarUrl;
    @Column(name = "auth_provider")
    private String authProvider;
    @Column(name = "provider_id")
    private String providerId;
    @Column(name = "role_id")
    private Long roleId;
    private String status;
    @Column(name = "email_verified")
    private Boolean emailVerified;
    @Column(name = "last_login_at")
    private LocalDateTime lastLoginAt;
    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;
}
