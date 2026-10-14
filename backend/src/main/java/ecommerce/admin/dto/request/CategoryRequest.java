package ecommerce.admin.dto.request;

import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CategoryRequest {
    private String name;
    private Long parentId;
    private String slug;
    private String description;
    private String icon;
    private String status;

}
