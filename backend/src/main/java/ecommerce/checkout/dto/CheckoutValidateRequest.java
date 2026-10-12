
package ecommerce.checkout.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public class CheckoutValidateRequest {

    @NotNull(message = "Vui lòng chọn địa chỉ giao hàng")
    @Positive(message = "ID địa chỉ không hợp lệ")
    private Long addressId;

    private String couponCode;

    public CheckoutValidateRequest() {
    }

    public Long getAddressId() {
        return addressId;
    }

    public void setAddressId(Long addressId) {
        this.addressId = addressId;
    }

    public String getCouponCode() {
        return couponCode;
    }

    public void setCouponCode(String couponCode) {
        this.couponCode = couponCode;
    }
}
