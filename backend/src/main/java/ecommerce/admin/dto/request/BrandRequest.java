package ecommerce.admin.dto.request;

import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BrandRequest {
    private String name;
    private String description;
    private String logoUrl;
    private String status;

}
