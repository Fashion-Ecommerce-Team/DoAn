package ecommerce.coupon.service;

import ecommerce.coupon.dto.CouponResponse;
import ecommerce.coupon.dto.CouponValidateResponse;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
public class CouponService {

    private static final BigDecimal SHIPPING_FEE =
            new BigDecimal("30000");

    private final JdbcTemplate jdbcTemplate;

    public CouponService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private BigDecimal getCartSubtotal(Long userId) {

        String sql = """
            SELECT COALESCE(
                SUM(
                    ci.quantity *
                    (p.base_price + COALESCE(v.price_adjustment, 0))
                ), 0
            )
            FROM cart_items ci
            JOIN product_variants v
                ON v.id = ci.product_variant_id
            JOIN products p
                ON p.id = v.product_id
            WHERE ci.user_id = ?
            """;

        BigDecimal subtotal = jdbcTemplate.queryForObject(
                sql,
                BigDecimal.class,
                userId
        );

        return subtotal == null ? BigDecimal.ZERO : subtotal;
    }

    private List<Map<String, Object>> findEligibleCoupons() {

        String sql = """
            SELECT *
            FROM coupons
            WHERE UPPER(status) = 'ACTIVE'
              AND start_date <= NOW()
              AND end_date >= NOW()
              AND (
                  usage_limit IS NULL
                  OR COALESCE(used_count, 0) < usage_limit
              )
            ORDER BY end_date ASC
            """;

        return jdbcTemplate.queryForList(sql);
    }

    public List<CouponResponse> getAvailableCoupons(Long userId) {

        BigDecimal subtotal = getCartSubtotal(userId);

        return findEligibleCoupons()
                .stream()
                .filter(row -> {
                    BigDecimal minimum =
                            toBigDecimal(row.get("min_order_value"));

                    return subtotal.compareTo(minimum) >= 0;
                })
                .map(row -> new CouponResponse(
                        String.valueOf(row.get("code")),
                        (String) row.get("description"),
                        String.valueOf(row.get("discount_type")),
                        toBigDecimal(row.get("discount_value")),
                        toBigDecimal(row.get("min_order_value")),
                        row.get("max_discount_amount") == null
                                ? null
                                : toBigDecimal(row.get("max_discount_amount")),
                        toDateTime(row.get("end_date"))
                ))
                .toList();
    }

    public CouponValidateResponse validate(
            Long userId,
            String couponCode
    ) {

        BigDecimal subtotal = getCartSubtotal(userId);

        if (subtotal.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException(
                    "Giỏ hàng đang trống"
            );
        }

        if (couponCode == null || couponCode.isBlank()) {
            throw new IllegalArgumentException(
                    "Vui lòng nhập mã giảm giá"
            );
        }

        String code = couponCode.trim();

        List<Map<String, Object>> coupons =
                jdbcTemplate.queryForList(
                        "SELECT * FROM coupons WHERE code = ?",
                        code
                );

        if (coupons.isEmpty()) {
            throw new IllegalArgumentException(
                    "Mã giảm giá không tồn tại"
            );
        }

        Map<String, Object> coupon = coupons.get(0);

        String status = String.valueOf(coupon.get("status"));

        if (!"ACTIVE".equalsIgnoreCase(status)) {
            throw new IllegalArgumentException(
                    "Mã giảm giá không hoạt động"
            );
        }

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime startDate =
                toDateTime(coupon.get("start_date"));
        LocalDateTime endDate =
                toDateTime(coupon.get("end_date"));

        if (now.isBefore(startDate) || now.isAfter(endDate)) {
            throw new IllegalArgumentException(
                    "Mã giảm giá chưa có hiệu lực hoặc đã hết hạn"
            );
        }

        Integer usageLimit =
                toInteger(coupon.get("usage_limit"));

        Integer usedCount =
                toInteger(coupon.get("used_count"));

        if (usageLimit != null
                && (usedCount == null ? 0 : usedCount) >= usageLimit) {
            throw new IllegalArgumentException(
                    "Mã giảm giá đã hết lượt sử dụng"
            );
        }

        BigDecimal minimum =
                toBigDecimal(coupon.get("min_order_value"));

        if (subtotal.compareTo(minimum) < 0) {
            throw new IllegalArgumentException(
                    "Đơn hàng chưa đạt giá trị tối thiểu "
                            + minimum.toPlainString() + "đ"
            );
        }

        String discountType =
                String.valueOf(coupon.get("discount_type"));

        BigDecimal discountValue =
                toBigDecimal(coupon.get("discount_value"));

        BigDecimal discountAmount;

        if ("PERCENTAGE".equalsIgnoreCase(discountType)) {

            if (discountValue.compareTo(BigDecimal.ZERO) <= 0
                    || discountValue.compareTo(
                            new BigDecimal("100")) > 0) {
                throw new IllegalArgumentException(
                        "Giá trị phần trăm giảm không hợp lệ"
                );
            }

            discountAmount = subtotal
                    .multiply(discountValue)
                    .divide(
                            new BigDecimal("100"),
                            2,
                            RoundingMode.HALF_UP
                    );

        } else if ("FIXED".equalsIgnoreCase(discountType)) {

            if (discountValue.compareTo(BigDecimal.ZERO) <= 0) {
                throw new IllegalArgumentException(
                        "Giá trị giảm cố định không hợp lệ"
                );
            }

            discountAmount = discountValue;

        } else {
            throw new IllegalArgumentException(
                    "Loại mã giảm giá không được hỗ trợ"
            );
        }

        Object maximumValue =
                coupon.get("max_discount_amount");

        if (maximumValue != null) {
            BigDecimal maximum = toBigDecimal(maximumValue);

            if (maximum.compareTo(BigDecimal.ZERO) >= 0) {
                discountAmount = discountAmount.min(maximum);
            }
        }

        // Không giảm quá giá trị hàng hóa.
        discountAmount = discountAmount.min(subtotal);

        BigDecimal totalAmount = subtotal
                .subtract(discountAmount)
                .add(SHIPPING_FEE);

        return new CouponValidateResponse(
                true,
                String.valueOf(coupon.get("code")),
                subtotal,
                discountAmount,
                SHIPPING_FEE,
                totalAmount,
                "Áp dụng mã giảm giá thành công"
        );
    }

    private BigDecimal toBigDecimal(Object value) {
        if (value == null) {
            return BigDecimal.ZERO;
        }

        return new BigDecimal(value.toString());
    }

    private Integer toInteger(Object value) {
        if (value == null) {
            return null;
        }

        return ((Number) value).intValue();
    }

    private LocalDateTime toDateTime(Object value) {
        if (value instanceof Timestamp timestamp) {
            return timestamp.toLocalDateTime();
        }

        if (value instanceof LocalDateTime dateTime) {
            return dateTime;
        }

        throw new IllegalArgumentException(
                "Dữ liệu ngày tháng không hợp lệ"
        );
    }
}