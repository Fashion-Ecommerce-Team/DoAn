package ecommerce.address.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AddressRequest {

    @NotBlank(message = "Tên người nhận không được để trống")
    @Size(max = 255, message = "Tên người nhận tối đa 255 ký tự")
    @Schema(description = "Họ và tên người nhận", example = "Nguyễn Văn A")
    private String receiverName;

    @NotBlank(message = "Số điện thoại người nhận không được để trống")
    @Pattern(regexp = "^[0-9]{10,11}$", message = "Số điện thoại không hợp lệ")
    @Schema(description = "Số điện thoại người nhận", example = "0987654321")
    private String receiverPhone;

    @NotBlank(message = "Địa chỉ chi tiết không được để trống")
    @Size(max = 500, message = "Địa chỉ chi tiết tối đa 500 ký tự")
    @Schema(description = "Địa chỉ chi tiết (số nhà, tên đường)", example = "Số 123 đường Cầu Giấy")
    private String addressLine;

    @Schema(description = "Tên đường phố (alias cho addressLine)")
    private String streetAddress;

    @NotBlank(message = "Tỉnh/thành phố không được để trống")
    @Size(max = 100, message = "Tỉnh/thành phố tối đa 100 ký tự")
    @Schema(description = "Tỉnh hoặc Thành phố", example = "Hà Nội")
    private String city;

    @Schema(description = "Tỉnh/thành phố (alias cho city)")
    private String province;

    @NotBlank(message = "Quận/huyện không được để trống")
    @Size(max = 100, message = "Quận/huyện tối đa 100 ký tự")
    @Schema(description = "Quận hoặc Huyện", example = "Hoàng Mai")
    private String district;

    @NotBlank(message = "Phường/xã không được để trống")
    @Size(max = 100, message = "Phường/xã tối đa 100 ký tự")
    @Schema(description = "Phường hoặc Xã", example = "Lĩnh Nam")
    private String ward;

    @Schema(description = "Đặt làm địa chỉ mặc định hay không", example = "true")
    private Boolean isDefault;

    public String resolveStreetAddress() {
        if (this.addressLine != null && !this.addressLine.trim().isEmpty()) {
            return this.addressLine.trim();
        }
        if (this.streetAddress != null && !this.streetAddress.trim().isEmpty()) {
            return this.streetAddress.trim();
        }
        return "";
    }

    public String resolveProvince() {
        if (this.city != null && !this.city.trim().isEmpty()) {
            return this.city.trim();
        }
        if (this.province != null && !this.province.trim().isEmpty()) {
            return this.province.trim();
        }
        return "";
    }
}
