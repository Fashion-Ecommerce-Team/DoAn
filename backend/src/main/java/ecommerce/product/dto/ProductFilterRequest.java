package ecommerce.product.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductFilterRequest {

    @Schema(description = "Từ khóa tìm kiếm theo tên hoặc mô tả", example = "Áo thun")
    private String keyword;

    @Schema(description = "ID danh mục sản phẩm", example = "1")
    private Long categoryId;

    @Schema(description = "Slug danh mục sản phẩm", example = "ao-nam")
    private String categorySlug;

    @Schema(description = "ID thương hiệu sản phẩm", example = "1")
    private Long brandId;

    @Schema(description = "Slug thương hiệu sản phẩm", example = "nike")
    private String brandSlug;

    @Schema(description = "Giới tính (MEN, WOMEN, UNISEX, KIDS)", example = "MEN")
    private String gender;

    @Schema(description = "Khoảng giá tối thiểu", example = "100000")
    private BigDecimal minPrice;

    @Schema(description = "Khoảng giá tối đa", example = "500000")
    private BigDecimal maxPrice;

    @Schema(description = "Trạng thái sản phẩm (mặc định: ACTIVE)", example = "ACTIVE")
    @Builder.Default
    private String status = "ACTIVE";

    @Schema(description = "Số trang (bắt đầu từ 0)", example = "0")
    @Builder.Default
    private Integer page = 0;

    @Schema(description = "Số lượng sản phẩm mỗi trang", example = "12")
    @Builder.Default
    private Integer size = 12;

    @Schema(description = "Trường sắp xếp (createdAt, basePrice, name)", example = "createdAt")
    @Builder.Default
    private String sortBy = "createdAt";

    @Schema(description = "Hướng sắp xếp (asc, desc)", example = "desc")
    @Builder.Default
    private String sortDir = "desc";
}
