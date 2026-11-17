
package ecommerce.checkout.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class CreateAddressRequest {

    @NotBlank(message = "Vui lòng nhập tên người nhận")
    @Size(max = 255)
    private String receiverName;

    @NotBlank(message = "Vui lòng nhập số điện thoại")
    @Size(max = 20)
    private String receiverPhone;

    @NotBlank(message = "Vui lòng nhập tỉnh/thành phố")
    @Size(max = 100)
    private String province;

    @NotBlank(message = "Vui lòng nhập quận/huyện")
    @Size(max = 100)
    private String district;

    @NotBlank(message = "Vui lòng nhập phường/xã")
    @Size(max = 100)
    private String ward;

    @NotBlank(message = "Vui lòng nhập địa chỉ chi tiết")
    @Size(max = 255)
    private String streetAddress;

    public String getReceiverName() {
        return receiverName;
    }

    public void setReceiverName(String receiverName) {
        this.receiverName = receiverName;
    }

    public String getReceiverPhone() {
        return receiverPhone;
    }

    public void setReceiverPhone(String receiverPhone) {
        this.receiverPhone = receiverPhone;
    }

    public String getProvince() {
        return province;
    }

    public void setProvince(String province) {
        this.province = province;
    }

    public String getDistrict() {
        return district;
    }

    public void setDistrict(String district) {
        this.district = district;
    }

    public String getWard() {
        return ward;
    }

    public void setWard(String ward) {
        this.ward = ward;
    }

    public String getStreetAddress() {
        return streetAddress;
    }

    public void setStreetAddress(String streetAddress) {
        this.streetAddress = streetAddress;
    }
}
