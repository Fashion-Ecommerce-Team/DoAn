package ecommerce.coupon.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record CouponResponse(
        String code,
        String description,
        String discountType,
        BigDecimal discountValue,
        BigDecimal minOrderValue,
        BigDecimal maxDiscountAmount,
        LocalDateTime endDate
) {}