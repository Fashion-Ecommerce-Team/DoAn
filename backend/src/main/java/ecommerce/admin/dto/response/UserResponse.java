package ecommerce.admin.dto.response;

import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserResponse {
    private Long id;
    private String email;
    private String fullName;
    private String avatarUrl;
    private String phone;
    private String status;
    private Long roleId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

}
