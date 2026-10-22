package ecommerce.admin.dto.response;

import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CategoryResponse {
    private Long id;
    private Long parentId;
    private String name;
    private String slug;
    private String description;
    private String icon;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

}
