
package ecommerce.order.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.PreparedStatement;
import java.sql.Statement;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import ecommerce.cart.entity.CartItem;
import ecommerce.cart.repository.CartItemRepository;
import ecommerce.order.dto.CreateOrderRequest;
import ecommerce.order.dto.CreateOrderResponse;

@Service
public class OrderService {

    private final JdbcTemplate jdbcTemplate;
    private final CartItemRepository cartItemRepository;
    private final BigDecimal shippingFee;

    public OrderService(
            JdbcTemplate jdbcTemplate,
            CartItemRepository cartItemRepository,
            @Value("${checkout.shipping-fee:30000}")
            BigDecimal shippingFee) {
        this.jdbcTemplate = jdbcTemplate;
        this.cartItemRepository = cartItemRepository;
        this.shippingFee = shippingFee;
    }

    @Transactional
    public CreateOrderResponse createOrder(
            Long userId,
            CreateOrderRequest request) {

        // 1. Kiểm tra địa chỉ thuộc user đang đăng nhập.
        List<Map<String, Object>> addresses =
                jdbcTemplate.queryForList("""
                    SELECT receiver_name, receiver_phone,
                           province, district, ward, street_address
                    FROM user_addresses
                    WHERE id = ? AND user_id = ?
                    FOR UPDATE
                    """,
                    request.getAddressId(), userId);

        if (addresses.isEmpty()) {
            throw new IllegalArgumentException(
                    "Địa chỉ không tồn tại hoặc không thuộc tài khoản của bạn");
        }

        Map<String, Object> address = addresses.get(0);

        String shippingAddress =
                address.get("street_address") + ", "
                + address.get("ward") + ", "
                + address.get("district") + ", "
                + address.get("province");

        // 2. Lấy giỏ hàng.
        List<CartItem> cartItems =
                cartItemRepository.findByUserId(userId);

        if (cartItems.isEmpty()) {
            throw new IllegalArgumentException("Giỏ hàng đang trống");
        }

        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal productDiscount = BigDecimal.ZERO;
        int itemCount = 0;

        // Lưu thông tin sản phẩm đã kiểm tra để dùng khi tạo order_details.
        java.util.List<Map<String, Object>> orderItems =
                new java.util.ArrayList<>();

        // 3. Kiểm tra lại sản phẩm, giá và tồn kho.
        // FOR UPDATE khóa các dòng biến thể trong transaction.
        for (CartItem cartItem : cartItems) {
            List<Map<String, Object>> variants =
                    jdbcTemplate.queryForList("""
                        SELECT
                            v.id AS variant_id,
                            v.size,
                            v.color,
                            v.price_adjustment,
                            v.stock_quantity,
                            v.status AS variant_status,
                            p.name AS product_name,
                            p.base_price,
                            p.discount_price,
                            p.status AS product_status,
                            p.deleted_at,
                            (
                                SELECT pi.image_url
                                FROM product_images pi
                                WHERE pi.product_id = p.id
                                  AND pi.is_primary = 1
                                ORDER BY pi.id
                                LIMIT 1
                            ) AS image_url
                        FROM product_variants v
                        JOIN products p ON p.id = v.product_id
                        WHERE v.id = ?
                        FOR UPDATE
                        """, cartItem.getProductVariantId());

            if (variants.isEmpty()) {
                throw new IllegalArgumentException(
                        "Không tìm thấy biến thể sản phẩm ID: "
                        + cartItem.getProductVariantId());
            }

            Map<String, Object> variant = variants.get(0);

            if (!"ACTIVE".equalsIgnoreCase(
                    String.valueOf(variant.get("product_status")))
                    || variant.get("deleted_at") != null
                    || !"ACTIVE".equalsIgnoreCase(
                    String.valueOf(variant.get("variant_status")))) {
                throw new IllegalArgumentException(
                        "Sản phẩm hoặc biến thể đã ngừng hoạt động");
            }

            int quantity = cartItem.getQuantity();
            int stock = ((Number) variant.get("stock_quantity")).intValue();

            if (quantity <= 0 || quantity > stock) {
                throw new IllegalArgumentException(
                        "Số lượng tồn kho không đủ cho sản phẩm: "
                        + variant.get("product_name"));
            }

            BigDecimal basePrice =
                    (BigDecimal) variant.get("base_price");

            BigDecimal discountPrice =
                    (BigDecimal) variant.get("discount_price");

            BigDecimal adjustment =
                    variant.get("price_adjustment") == null
                    ? BigDecimal.ZERO
                    : (BigDecimal) variant.get("price_adjustment");

            BigDecimal originalPrice = basePrice.add(adjustment);
            BigDecimal unitPrice = originalPrice;

            if (discountPrice != null
                    && discountPrice.compareTo(BigDecimal.ZERO) > 0
                    && discountPrice.compareTo(basePrice) < 0) {
                unitPrice = discountPrice.add(adjustment);
            }

            if (unitPrice.compareTo(BigDecimal.ZERO) < 0) {
                throw new IllegalArgumentException(
                        "Giá sản phẩm không hợp lệ");
            }

            BigDecimal qty = BigDecimal.valueOf(quantity);

            subtotal = subtotal.add(originalPrice.multiply(qty));
            productDiscount = productDiscount.add(
                    originalPrice.subtract(unitPrice).multiply(qty));
            itemCount += quantity;

            variant.put("quantity", quantity);
            variant.put("unit_price", unitPrice);
            orderItems.add(variant);
        }

        // 4. Tính giảm giá coupon nếu người dùng nhập mã.
        Long couponId = null;
        BigDecimal couponDiscount = BigDecimal.ZERO;
        String couponCode = request.getCouponCode();

        if (couponCode != null && !couponCode.isBlank()) {
            List<Map<String, Object>> coupons =
                    jdbcTemplate.queryForList("""
                        SELECT id, code, discount_type, discount_value,
                               min_order_value, max_discount_amount,
                               usage_limit, used_count,
                               start_date, end_date, status
                        FROM coupons
                        WHERE UPPER(code) = UPPER(?)
                        FOR UPDATE
                        """, couponCode.trim());

            if (coupons.isEmpty()) {
                throw new IllegalArgumentException(
                        "Mã giảm giá không tồn tại");
            }

            Map<String, Object> coupon = coupons.get(0);
            LocalDateTime now = LocalDateTime.now();

            LocalDateTime startDate =
                    toLocalDateTime(coupon.get("start_date"));
            LocalDateTime endDate =
                    toLocalDateTime(coupon.get("end_date"));

            int usedCount = coupon.get("used_count") == null
                    ? 0
                    : ((Number) coupon.get("used_count")).intValue();

            Object limitObject = coupon.get("usage_limit");
            boolean withinLimit = limitObject == null
                    || usedCount < ((Number) limitObject).intValue();

            if (!"ACTIVE".equalsIgnoreCase(
                    String.valueOf(coupon.get("status")))) {
                throw new IllegalArgumentException(
                        "Mã giảm giá không hoạt động");
            }

            if (startDate == null || endDate == null
                    || now.isBefore(startDate) || now.isAfter(endDate)) {
                throw new IllegalArgumentException(
                        "Mã giảm giá chưa có hiệu lực hoặc đã hết hạn");
            }

            if (!withinLimit) {
                throw new IllegalArgumentException(
                        "Mã giảm giá đã hết lượt sử dụng");
            }

            BigDecimal eligibleAmount =
                    subtotal.subtract(productDiscount);

            BigDecimal minOrderValue =
                    coupon.get("min_order_value") == null
                    ? BigDecimal.ZERO
                    : (BigDecimal) coupon.get("min_order_value");

            if (eligibleAmount.compareTo(minOrderValue) < 0) {
                throw new IllegalArgumentException(
                        "Đơn hàng chưa đạt giá trị tối thiểu áp dụng mã");
            }

            BigDecimal discountValue =
                    (BigDecimal) coupon.get("discount_value");

            String discountType = String.valueOf(
                    coupon.get("discount_type")).toUpperCase();

            if ("PERCENTAGE".equals(discountType)
                    || "PERCENT".equals(discountType)) {
                couponDiscount = eligibleAmount
                        .multiply(discountValue)
                        .divide(BigDecimal.valueOf(100), 2,
                                RoundingMode.HALF_UP);
            } else if ("FIXED".equals(discountType)
                    || "AMOUNT".equals(discountType)) {
                couponDiscount = discountValue;
            } else {
                throw new IllegalArgumentException(
                        "Loại mã giảm giá chưa được hỗ trợ: "
                        + discountType);
            }

            Object maxDiscountObject =
                    coupon.get("max_discount_amount");

            if (maxDiscountObject != null) {
                BigDecimal maxDiscount =
                        (BigDecimal) maxDiscountObject;

                if (couponDiscount.compareTo(maxDiscount) > 0) {
                    couponDiscount = maxDiscount;
                }
            }

            if (couponDiscount.compareTo(eligibleAmount) > 0) {
                couponDiscount = eligibleAmount;
            }

            couponId = ((Number) coupon.get("id")).longValue();
        }

        // 5. Tính tiền cuối cùng.
        BigDecimal discountAmount =
                productDiscount.add(couponDiscount);

        BigDecimal totalAmount = subtotal
                .subtract(discountAmount)
                .add(shippingFee);

        if (totalAmount.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException(
                    "Tổng tiền đơn hàng không hợp lệ");
        }

        // 6. Tạo đơn hàng.
        KeyHolder keyHolder = new GeneratedKeyHolder();

        String insertOrderSql = """
            INSERT INTO orders (
                user_id, coupon_id,
                receiver_name, receiver_phone, shipping_address,
                order_note, subtotal_amount, shipping_fee,
                discount_amount, total_amount, status
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """;


final Long finalCouponId = couponId;
final BigDecimal finalSubtotal = subtotal;
final BigDecimal finalShippingFee = shippingFee;
final BigDecimal finalDiscountAmount = discountAmount;
final BigDecimal finalTotalAmount = totalAmount;
final String finalShippingAddress = shippingAddress;
final String finalOrderNote = request.getOrderNote();
final String finalReceiverName = String.valueOf(address.get("receiver_name"));
final String finalReceiverPhone = String.valueOf(address.get("receiver_phone"));

jdbcTemplate.update(connection -> {
    PreparedStatement ps = connection.prepareStatement(
        insertOrderSql, Statement.RETURN_GENERATED_KEYS
    );

    ps.setLong(1, userId);

    if (finalCouponId == null) {
        ps.setNull(2, java.sql.Types.BIGINT);
    } else {
        ps.setLong(2, finalCouponId);
    }

    ps.setString(3, finalReceiverName);
    ps.setString(4, finalReceiverPhone);
    ps.setString(5, finalShippingAddress);
    ps.setString(6, finalOrderNote);
    ps.setBigDecimal(7, finalSubtotal);
    ps.setBigDecimal(8, finalShippingFee);
    ps.setBigDecimal(9, finalDiscountAmount);
    ps.setBigDecimal(10, finalTotalAmount);
    ps.setString(11, "PENDING");

    return ps;
}, keyHolder);


        if (keyHolder.getKey() == null) {
            throw new IllegalStateException(
                    "Không lấy được ID đơn hàng vừa tạo");
        }

        Long orderId = keyHolder.getKey().longValue();

        // 7. Lưu chi tiết đơn hàng và trừ tồn kho có điều kiện.
        for (Map<String, Object> item : orderItems) {
            int quantity = ((Number) item.get("quantity")).intValue();
            long variantId = ((Number) item.get("variant_id")).longValue();

            jdbcTemplate.update("""
                INSERT INTO order_details (
                    order_id, product_variant_id, product_name,
                    product_image_url, variant_size, variant_color,
                    quantity, unit_price
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                orderId,
                variantId,
                item.get("product_name"),
                item.get("image_url"),
                item.get("size"),
                item.get("color"),
                quantity,
                item.get("unit_price"));

            int updated = jdbcTemplate.update("""
                UPDATE product_variants
                SET stock_quantity = stock_quantity - ?
                WHERE id = ?
                  AND stock_quantity >= ?
                  AND status = 'ACTIVE'
                """, quantity, variantId, quantity);

            if (updated != 1) {
                throw new IllegalArgumentException(
                        "Tồn kho đã thay đổi, vui lòng thử đặt hàng lại");
            }
        }

        // 8. Tăng lượt sử dụng coupon.
        if (couponId != null) {
            int updated = jdbcTemplate.update("""
                UPDATE coupons
                SET used_count = used_count + 1
                WHERE id = ?
                  AND (usage_limit IS NULL OR used_count < usage_limit)
                """, couponId);

            if (updated != 1) {
                throw new IllegalArgumentException(
                        "Mã giảm giá vừa hết lượt sử dụng");
            }
        }

        // 9. Ghi lịch sử trạng thái ban đầu.
        jdbcTemplate.update("""
            INSERT INTO order_status_history (
                order_id, old_status, new_status, changed_by, note
            )
            VALUES (?, NULL, 'PENDING', ?, ?)
            """, orderId, userId, "Đơn hàng được tạo");

        // 10. Xóa giỏ hàng sau khi toàn bộ thao tác thành công.
        cartItemRepository.deleteByUserId(userId);

        return new CreateOrderResponse(
                orderId,
                "PENDING",
                subtotal,
                shippingFee,
                discountAmount,
                totalAmount);
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
}
