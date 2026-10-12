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
    @Pattern(regexp = "^[0-9]{10,11}$", message = "Số điện thoại phải từ 10 đến 11 chữ số")
    @Schema(description = "Số điện thoại người nhận", example = "0987654321")
    private String receiverPhone;

    @Schema(description = "Số nhà, tên đường (chi tiết)", example = "Số 123 đường Cầu Giấy")
    private String streetAddress;

    @Schema(description = "Địa chỉ chi tiết (tương thích cũ)", example = "Số 123 đường Cầu Giấy")
    private String addressLine;

    @Schema(description = "Tỉnh hoặc Thành phố", example = "Hà Nội")
    private String province;

    @Schema(description = "Tỉnh hoặc Thành phố (tương thích cũ)", example = "Hà Nội")
    private String city;

    @NotBlank(message = "Quận/huyện không được để trống")
    @Size(max = 100, message = "Quận/huyện tối đa 100 ký tự")
    @Schema(description = "Quận hoặc Huyện", example = "Cầu Giấy")
    private String district;

    @NotBlank(message = "Phường/xã không được để trống")
    @Size(max = 100, message = "Phường/xã tối đa 100 ký tự")
    @Schema(description = "Phường hoặc Xã", example = "Dịch Vọng")
    private String ward;

    @Schema(description = "Đặt làm địa chỉ mặc định hay không", example = "true")
    private Boolean isDefault;

    public String resolveProvince() {
        if (province != null && !province.isBlank()) return province.trim();
        if (city != null && !city.isBlank()) return city.trim();
        return "";
    }

    public String resolveStreetAddress() {
        if (streetAddress != null && !streetAddress.isBlank()) return streetAddress.trim();
        if (addressLine != null && !addressLine.isBlank()) return addressLine.trim();
        return "";
    }
}
