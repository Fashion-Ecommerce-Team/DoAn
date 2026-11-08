package ecommerce.coupon.dto;

import jakarta.validation.constraints.NotBlank;

public class CouponValidateRequest {

    @NotBlank(message = "Vui lòng nhập mã giảm giá")
    private String couponCode;

    public String getCouponCode() {
        return couponCode;
    }

    public void setCouponCode(String couponCode) {
        this.couponCode = couponCode;
    }
}