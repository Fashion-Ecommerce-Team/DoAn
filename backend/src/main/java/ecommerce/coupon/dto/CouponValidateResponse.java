package ecommerce.coupon.dto;

import java.math.BigDecimal;

public record CouponValidateResponse(
        boolean valid,
        String couponCode,
        BigDecimal subtotal,
        BigDecimal discountAmount,
        BigDecimal shippingFee,
        BigDecimal totalAmount,
        String message
) {}