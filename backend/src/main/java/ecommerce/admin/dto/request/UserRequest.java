package ecommerce.admin.dto.request;

import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserRequest {
    private String email;
    private String fullName;
    private String phone;
    private String status;
    private Long roleId;

}
