
package ecommerce.checkout.service;

import ecommerce.cart.entity.CartItem;
import ecommerce.cart.repository.CartItemRepository;
import ecommerce.cart.service.CartService;
import ecommerce.checkout.dto.CheckoutPreviewResponse;
import ecommerce.checkout.dto.CheckoutValidateRequest;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class CheckoutService {

    private final CartItemRepository cartItemRepository;
    private final JdbcTemplate jdbcTemplate;
    private final CartService cartService;
    private final BigDecimal shippingFee;

    public CheckoutService(
            CartItemRepository cartItemRepository,
            JdbcTemplate jdbcTemplate,
            CartService cartService,
            @Value("${checkout.shipping-fee:30000}") BigDecimal shippingFee) {
        this.cartItemRepository = cartItemRepository;
        this.jdbcTemplate = jdbcTemplate;
        this.cartService = cartService;
        this.shippingFee = shippingFee;
    }

    /**
     * Xem trước đơn hàng, chưa tạo đơn và chưa trừ tồn kho.
     */
    @Transactional(readOnly = true)
    public CheckoutPreviewResponse preview(Long userId) {

        List<CartItem> cartItems =
                cartItemRepository.findByUserId(userId);

        if (cartItems.isEmpty()) {
            throw new IllegalArgumentException("Giỏ hàng đang trống");
        }

        List<CheckoutPreviewResponse.Item> items = new ArrayList<>();

        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal productDiscount = BigDecimal.ZERO;
        int itemCount = 0;

        for (CartItem cartItem : cartItems) {

            String sql = """
                    SELECT
                        p.name AS product_name,
                        p.base_price AS base_price,
                        p.discount_price AS discount_price,
                        p.status AS product_status,
                        p.deleted_at AS deleted_at,
                        v.size AS size,
                        v.color AS color,
                        v.price_adjustment AS price_adjustment,
                        v.stock_quantity AS stock_quantity,
                        v.status AS variant_status,
                        (
                            SELECT pi.image_url
                            FROM product_images pi
                            WHERE pi.product_id = p.id
                              AND pi.is_primary = 1
                            LIMIT 1
                        ) AS image_url
                    FROM product_variants v
                    INNER JOIN products p ON p.id = v.product_id
                    WHERE v.id = ?
                    """;

            List<Map<String, Object>> rows =
                    jdbcTemplate.queryForList(
                            sql, cartItem.getProductVariantId());

            if (rows.isEmpty()) {
                throw new IllegalArgumentException(
                        "Không tìm thấy biến thể sản phẩm ID: "
                                + cartItem.getProductVariantId());
            }

            Map<String, Object> row = rows.get(0);

            if (!"ACTIVE".equalsIgnoreCase(
                    String.valueOf(row.get("product_status")))
                    || row.get("deleted_at") != null
                    || !"ACTIVE".equalsIgnoreCase(
                    String.valueOf(row.get("variant_status")))) {
                throw new IllegalArgumentException(
                        "Sản phẩm hoặc biến thể đã ngừng hoạt động");
            }

            int stock =
                    ((Number) row.get("stock_quantity")).intValue();

            if (cartItem.getQuantity() > stock) {
                throw new IllegalArgumentException(
                        "Sản phẩm ID "
                                + cartItem.getProductVariantId()
                                + " không đủ tồn kho");
            }

            BigDecimal basePrice =
                    (BigDecimal) row.get("base_price");

            BigDecimal discountPrice =
                    (BigDecimal) row.get("discount_price");

            BigDecimal priceAdjustment =
                    row.get("price_adjustment") == null
                            ? BigDecimal.ZERO
                            : (BigDecimal) row.get("price_adjustment");

            BigDecimal originalUnitPrice =
                    basePrice.add(priceAdjustment);

            BigDecimal unitPrice = originalUnitPrice;

            if (discountPrice != null
                    && discountPrice.compareTo(BigDecimal.ZERO) > 0
                    && discountPrice.compareTo(basePrice) < 0) {
                unitPrice = discountPrice.add(priceAdjustment);
            }

            if (unitPrice.compareTo(BigDecimal.ZERO) < 0) {
                throw new IllegalArgumentException(
                        "Giá sản phẩm không hợp lệ");
            }

            BigDecimal quantity =
                    BigDecimal.valueOf(cartItem.getQuantity());

            BigDecimal lineTotal = unitPrice.multiply(quantity);

            BigDecimal lineDiscount = originalUnitPrice
                    .subtract(unitPrice)
                    .multiply(quantity);

            subtotal = subtotal.add(originalUnitPrice.multiply(quantity));
            productDiscount = productDiscount.add(lineDiscount);
            itemCount += cartItem.getQuantity();

            items.add(new CheckoutPreviewResponse.Item(
                    cartItem.getId(),
                    cartItem.getProductVariantId(),
                    (String) row.get("product_name"),
                    (String) row.get("size"),
                    (String) row.get("color"),
                    (String) row.get("image_url"),
                    cartItem.getQuantity(),
                    unitPrice,
                    lineTotal
            ));
        }

        BigDecimal totalAmount = subtotal
                .subtract(productDiscount)
                .add(shippingFee);

        return new CheckoutPreviewResponse(
                items,
                itemCount,
                subtotal,
                productDiscount,
                shippingFee,
                totalAmount
        );
    }

    /**
     * Kiểm tra địa chỉ, giỏ hàng, tồn kho và mã giảm giá.
     * Không tạo đơn hàng và không trừ tồn kho.
     */
    @Transactional(readOnly = true)
    public Map<String, Object> validate(
            Long userId,
            CheckoutValidateRequest request) {

        Map<String, Object> result = new LinkedHashMap<>();
        List<String> errors = new ArrayList<>();

        // 1. Kiểm tra địa chỉ thuộc người dùng đang đăng nhập.
        List<Map<String, Object>> addresses =
                jdbcTemplate.queryForList(
                        """
                        SELECT id, receiver_name, receiver_phone,
                               province, district, ward, street_address
                        FROM user_addresses
                        WHERE id = ? AND user_id = ?
                        """,
                        request.getAddressId(),
                        userId
                );

        boolean addressValid = !addresses.isEmpty();

        result.put("addressValid", addressValid);

        if (addressValid) {
            result.put("address", addresses.get(0));
        } else {
            errors.add(
                    "Địa chỉ giao hàng không tồn tại hoặc không thuộc về bạn");
        }

        // 2. Kiểm tra giỏ hàng và tồn kho.
        Map<String, Object> cartResult =
                cartService.validateCart(userId);

        boolean cartValid =
                Boolean.TRUE.equals(cartResult.get("valid"));

        result.put("cartValid", cartValid);
        result.put("cart", cartResult);

        if (!cartValid) {
            errors.add(String.valueOf(cartResult.get("message")));
        }

        // 3. Kiểm tra mã giảm giá nếu người dùng nhập.
        String couponCode = request.getCouponCode();

        if (couponCode != null && !couponCode.isBlank()) {
            try {
                List<Map<String, Object>> coupons =
                        jdbcTemplate.queryForList(
                                """
                                SELECT id, code, discount_type,
                                       discount_value, min_order_value,
                                       max_discount_amount, usage_limit,
                                       used_count, start_date, end_date, status
                                FROM coupons
                                WHERE UPPER(code) = UPPER(?)
                                """,
                                couponCode.trim()
                        );

                boolean couponValid = false;
                String couponMessage = "Mã giảm giá không tồn tại";

                if (!coupons.isEmpty()) {
                    Map<String, Object> coupon = coupons.get(0);

                    LocalDateTime now = LocalDateTime.now();
                    LocalDateTime startDate =
                            toLocalDateTime(coupon.get("start_date"));
                    LocalDateTime endDate =
                            toLocalDateTime(coupon.get("end_date"));

                    int usedCount =
                            ((Number) coupon.get("used_count")).intValue();

                    Object usageLimitObject = coupon.get("usage_limit");

                    boolean withinUsageLimit =
                            usageLimitObject == null
                                    || usedCount < ((Number)
                                    usageLimitObject).intValue();

                    boolean active =
                            "ACTIVE".equalsIgnoreCase(
                                    String.valueOf(coupon.get("status")));

                    boolean withinDate =
                            startDate != null
                                    && endDate != null
                                    && !now.isBefore(startDate)
                                    && !now.isAfter(endDate);

                    couponValid =
                            active && withinDate && withinUsageLimit;

                    if (!active) {
                        couponMessage = "Mã giảm giá không hoạt động";
                    } else if (!withinDate) {
                        couponMessage =
                                "Mã giảm giá chưa có hiệu lực hoặc đã hết hạn";
                    } else if (!withinUsageLimit) {
                        couponMessage = "Mã giảm giá đã hết lượt sử dụng";
                    } else {
                        couponMessage =
                                "Mã giảm giá hợp lệ về trạng thái và thời hạn";
                    }

                    result.put("couponId", coupon.get("id"));
                }

                result.put("couponValid", couponValid);
                result.put("couponMessage", couponMessage);

                if (!couponValid) {
                    errors.add(couponMessage);
                }
            } catch (DataAccessException ex) {
                throw new IllegalStateException(
                        "Không thể kiểm tra mã giảm giá trong cơ sở dữ liệu",
                        ex);
            }
        } else {
            result.put("couponValid", true);
            result.put("couponMessage", "Không sử dụng mã giảm giá");
        }

        result.put("valid", errors.isEmpty());
        result.put("errors", errors);
        result.put("message", errors.isEmpty()
                ? "Thông tin checkout hợp lệ"
                : "Checkout chưa hợp lệ, vui lòng kiểm tra lại");

        return result;
    }

    private LocalDateTime toLocalDateTime(Object value) {
        if (value instanceof Timestamp timestamp) {
            return timestamp.toLocalDateTime();
        }

        if (value instanceof LocalDateTime dateTime) {
            return dateTime;
        }

        if (value instanceof java.sql.Date date) {
            return date.toLocalDate().atStartOfDay();
        }

        return null;
    }
    
/**
 * Lấy danh sách địa chỉ giao hàng của user đang đăng nhập.
 */
@Transactional(readOnly = true)
public List<Map<String, Object>> getAddresses(Long userId) {

    String sql = """
        SELECT
            id,
            receiver_name,
            receiver_phone,
            province,
            district,
            ward,
            street_address,
            is_default
        FROM user_addresses
        WHERE user_id = ?
        ORDER BY is_default DESC, id DESC
        """;

    return jdbcTemplate.queryForList(sql, userId);
}

}
