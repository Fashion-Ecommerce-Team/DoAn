package ecommerce.wishlist.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WishlistRequest {

    @NotNull(message = "ID sản phẩm không được để trống")
    @Schema(description = "ID sản phẩm muốn thêm vào danh sách yêu thích", example = "1")
    private Long productId;
}
