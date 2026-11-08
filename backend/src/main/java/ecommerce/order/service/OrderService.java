
package ecommerce.order.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.PreparedStatement;
import java.sql.Statement;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
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

    // =====================================================
    // API 13: TẠO ĐƠN HÀNG
    // =====================================================

    @Transactional
    public CreateOrderResponse createOrder(
            Long userId,
            CreateOrderRequest request) {

        if (userId == null) {
            throw new IllegalArgumentException(
                    "Người dùng chưa đăng nhập");
        }

        if (request == null || request.getAddressId() == null) {
            throw new IllegalArgumentException(
                    "Vui lòng chọn địa chỉ giao hàng");
        }

        String paymentMethod = request.getPaymentMethod();

        if (!"COD".equals(paymentMethod)
                && !"VIETQR".equals(paymentMethod)) {
            throw new IllegalArgumentException(
                    "Chỉ hỗ trợ thanh toán COD hoặc VIETQR");
        }

        // 1. Khóa user để tuần tự hóa các lần checkout
        // của cùng tài khoản.
        List<Long> lockedUsers = jdbcTemplate.queryForList("""
            SELECT id
            FROM users
            WHERE id = ?
            FOR UPDATE
            """, Long.class, userId);

        if (lockedUsers.isEmpty()) {
            throw new IllegalArgumentException(
                    "Tài khoản không tồn tại");
        }

        // 2. Kiểm tra địa chỉ giao hàng
        List<Map<String, Object>> addresses =
                jdbcTemplate.queryForList("""
                    SELECT
                        receiver_name,
                        receiver_phone,
                        province,
                        district,
                        ward,
                        street_address
                    FROM user_addresses
                    WHERE id = ? AND user_id = ?
                    FOR UPDATE
                    """,
                    request.getAddressId(),
                    userId);

        if (addresses.isEmpty()) {
            throw new IllegalArgumentException(
                    "Địa chỉ không tồn tại hoặc không thuộc tài khoản");
        }

        Map<String, Object> address = addresses.get(0);

        String receiverName =
                String.valueOf(address.get("receiver_name"));

        String receiverPhone =
                String.valueOf(address.get("receiver_phone"));

        String shippingAddress =
                String.valueOf(address.get("street_address"))
                + ", " + String.valueOf(address.get("ward"))
                + ", " + String.valueOf(address.get("district"))
                + ", " + String.valueOf(address.get("province"));

        // 3. Khóa và lấy giỏ hàng.
        // Sử dụng JDBC để đọc dữ liệu mới nhất.
        List<Map<String, Object>> cartItems =
                jdbcTemplate.queryForList("""
                    SELECT
                        id,
                        product_variant_id,
                        quantity
                    FROM cart_items
                    WHERE user_id = ?
                    ORDER BY product_variant_id ASC
                    FOR UPDATE
                    """, userId);

        if (cartItems.isEmpty()) {
            throw new IllegalArgumentException(
                    "Giỏ hàng đang trống");
        }

        BigDecimal subtotal = BigDecimal.ZERO;

        List<Map<String, Object>> orderItems =
                new ArrayList<>();

        // 4. Kiểm tra sản phẩm, giá và tồn kho
        for (Map<String, Object> cartItem : cartItems) {

            Long variantId =
                    ((Number) cartItem.get(
                            "product_variant_id")).longValue();

            int quantity =
                    ((Number) cartItem.get("quantity")).intValue();

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
                            p.status AS product_status,
                            p.deleted_at,
                            (
                                SELECT pi.image_url
                                FROM product_images pi
                                WHERE pi.product_id = p.id
                                  AND pi.is_primary = 1
                                ORDER BY pi.id ASC
                                LIMIT 1
                            ) AS image_url
                        FROM product_variants v
                        JOIN products p
                            ON p.id = v.product_id
                        WHERE v.id = ?
                        FOR UPDATE
                        """, variantId);

            if (variants.isEmpty()) {
                throw new IllegalArgumentException(
                        "Không tìm thấy biến thể sản phẩm ID: "
                        + variantId);
            }

            Map<String, Object> variant = variants.get(0);

            String productStatus =
                    String.valueOf(variant.get("product_status"));

            String variantStatus =
                    String.valueOf(variant.get("variant_status"));

            if (!"ACTIVE".equalsIgnoreCase(productStatus)
                    || !"ACTIVE".equalsIgnoreCase(variantStatus)
                    || variant.get("deleted_at") != null) {

                throw new IllegalArgumentException(
                        "Sản phẩm đã ngừng hoạt động: "
                        + variant.get("product_name"));
            }

            int stock =
                    ((Number) variant.get(
                            "stock_quantity")).intValue();

            if (quantity <= 0) {
                throw new IllegalArgumentException(
                        "Số lượng sản phẩm không hợp lệ");
            }

            if (quantity > stock) {
                throw new IllegalArgumentException(
                        "Không đủ tồn kho cho sản phẩm: "
                        + variant.get("product_name")
                        + ". Còn lại: " + stock);
            }

            BigDecimal basePrice =
                    (BigDecimal) variant.get("base_price");

            BigDecimal adjustment =
                    variant.get("price_adjustment") == null
                    ? BigDecimal.ZERO
                    : (BigDecimal) variant.get(
                            "price_adjustment");

            // Không sử dụng discount_price.
            BigDecimal unitPrice =
                    basePrice.add(adjustment);

            if (unitPrice.compareTo(BigDecimal.ZERO) < 0) {
                throw new IllegalArgumentException(
                        "Giá sản phẩm không hợp lệ");
            }

            BigDecimal lineTotal =
                    unitPrice.multiply(
                            BigDecimal.valueOf(quantity));

            subtotal = subtotal.add(lineTotal);

            variant.put("quantity", quantity);
            variant.put("unit_price", unitPrice);

            orderItems.add(variant);
        }

        // 5. Kiểm tra và tính coupon
        Long couponId = null;
        BigDecimal couponDiscount = BigDecimal.ZERO;

        String couponCode = request.getCouponCode();

        if (couponCode != null && !couponCode.isBlank()) {

            List<Map<String, Object>> coupons =
                    jdbcTemplate.queryForList("""
                        SELECT
                            id,
                            code,
                            discount_type,
                            discount_value,
                            min_order_value,
                            max_discount_amount,
                            usage_limit,
                            used_count,
                            start_date,
                            end_date,
                            status
                        FROM coupons
                        WHERE UPPER(code) = UPPER(?)
                        FOR UPDATE
                        """, couponCode.trim());

            if (coupons.isEmpty()) {
                throw new IllegalArgumentException(
                        "Mã giảm giá không tồn tại");
            }

            Map<String, Object> coupon = coupons.get(0);

            if (!"ACTIVE".equalsIgnoreCase(
                    String.valueOf(coupon.get("status")))) {
                throw new IllegalArgumentException(
                        "Mã giảm giá không hoạt động");
            }

            LocalDateTime now = LocalDateTime.now();

            LocalDateTime startDate =
                    toLocalDateTime(coupon.get("start_date"));

            LocalDateTime endDate =
                    toLocalDateTime(coupon.get("end_date"));

            if (startDate == null
                    || endDate == null
                    || now.isBefore(startDate)
                    || now.isAfter(endDate)) {

                throw new IllegalArgumentException(
                        "Mã giảm giá chưa có hiệu lực hoặc đã hết hạn");
            }

            int usedCount =
                    coupon.get("used_count") == null
                    ? 0
                    : ((Number) coupon.get(
                            "used_count")).intValue();

            Object usageLimit = coupon.get("usage_limit");

            if (usageLimit != null
                    && usedCount >=
                    ((Number) usageLimit).intValue()) {

                throw new IllegalArgumentException(
                        "Mã giảm giá đã hết lượt sử dụng");
            }

            BigDecimal minOrderValue =
                    coupon.get("min_order_value") == null
                    ? BigDecimal.ZERO
                    : (BigDecimal) coupon.get(
                            "min_order_value");

            if (subtotal.compareTo(minOrderValue) < 0) {
                throw new IllegalArgumentException(
                        "Đơn hàng chưa đạt giá trị tối thiểu "
                        + "để áp dụng mã giảm giá");
            }

            BigDecimal discountValue =
                    (BigDecimal) coupon.get("discount_value");

            if (discountValue == null
                    || discountValue.compareTo(
                            BigDecimal.ZERO) < 0) {
                throw new IllegalArgumentException(
                        "Giá trị mã giảm giá không hợp lệ");
            }

            String discountType =
                    String.valueOf(
                            coupon.get("discount_type"))
                            .toUpperCase();

            if ("PERCENTAGE".equals(discountType)
                    || "PERCENT".equals(discountType)) {

                if (discountValue.compareTo(
                        new BigDecimal("100")) > 0) {
                    throw new IllegalArgumentException(
                            "Phần trăm giảm giá không hợp lệ");
                }

                couponDiscount = subtotal
                        .multiply(discountValue)
                        .divide(
                                BigDecimal.valueOf(100),
                                2,
                                RoundingMode.HALF_UP);

            } else if ("FIXED".equals(discountType)
                    || "AMOUNT".equals(discountType)) {

                couponDiscount = discountValue;

            } else {
                throw new IllegalArgumentException(
                        "Loại coupon không được hỗ trợ: "
                        + discountType);
            }

            Object maxDiscountObject =
                    coupon.get("max_discount_amount");

            if (maxDiscountObject != null) {
                BigDecimal maxDiscount =
                        (BigDecimal) maxDiscountObject;

                if (couponDiscount.compareTo(
                        maxDiscount) > 0) {
                    couponDiscount = maxDiscount;
                }
            }

            if (couponDiscount.compareTo(subtotal) > 0) {
                couponDiscount = subtotal;
            }

            if (couponDiscount.compareTo(
                    BigDecimal.ZERO) < 0) {
                throw new IllegalArgumentException(
                        "Số tiền giảm giá không hợp lệ");
            }

            couponId =
                    ((Number) coupon.get("id")).longValue();
        }

        // 6. Tính tổng thanh toán
        BigDecimal totalAmount = subtotal
                .subtract(couponDiscount)
                .add(shippingFee);

        if (totalAmount.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException(
                    "Tổng tiền đơn hàng không hợp lệ");
        }

        // 7. Tạo đơn hàng
        String insertOrderSql = """
            INSERT INTO orders (
                user_id,
                coupon_id,
                receiver_name,
                receiver_phone,
                shipping_address,
                order_note,
                subtotal_amount,
                shipping_fee,
                discount_amount,
                total_amount,
                status
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """;

        final Long finalCouponId = couponId;
        final BigDecimal finalSubtotal = subtotal;
        final BigDecimal finalDiscount = couponDiscount;
        final BigDecimal finalTotal = totalAmount;

        KeyHolder keyHolder = new GeneratedKeyHolder();

        jdbcTemplate.update(connection -> {

            PreparedStatement ps =
                    connection.prepareStatement(
                            insertOrderSql,
                            Statement.RETURN_GENERATED_KEYS);

            ps.setLong(1, userId);

            if (finalCouponId == null) {
                ps.setNull(2, java.sql.Types.BIGINT);
            } else {
                ps.setLong(2, finalCouponId);
            }

            ps.setString(3, receiverName);
            ps.setString(4, receiverPhone);
            ps.setString(5, shippingAddress);
            ps.setString(6, request.getOrderNote());
            ps.setBigDecimal(7, finalSubtotal);
            ps.setBigDecimal(8, shippingFee);
            ps.setBigDecimal(9, finalDiscount);
            ps.setBigDecimal(10, finalTotal);
            ps.setString(11, "PENDING");

            return ps;

        }, keyHolder);

        if (keyHolder.getKey() == null) {
            throw new IllegalStateException(
                    "Không lấy được ID đơn hàng vừa tạo");
        }

        Long orderId =
                keyHolder.getKey().longValue();

        // 8. Tạo chi tiết đơn và trừ tồn kho
        for (Map<String, Object> item : orderItems) {

            Long variantId =
                    ((Number) item.get(
                            "variant_id")).longValue();

            int quantity =
                    ((Number) item.get("quantity")).intValue();

            jdbcTemplate.update("""
                INSERT INTO order_details (
                    order_id,
                    product_variant_id,
                    product_name,
                    product_image_url,
                    variant_size,
                    variant_color,
                    quantity,
                    unit_price
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
                """,
                quantity,
                variantId,
                quantity);

            if (updated != 1) {
                throw new IllegalArgumentException(
                        "Tồn kho đã thay đổi. "
                        + "Vui lòng thử đặt hàng lại");
            }
        }

        // 9. Tăng lượt sử dụng coupon
        if (couponId != null) {

            int updated = jdbcTemplate.update("""
                UPDATE coupons
                SET used_count = COALESCE(used_count, 0) + 1
                WHERE id = ?
                  AND (
                      usage_limit IS NULL
                      OR COALESCE(used_count, 0) < usage_limit
                  )
                """, couponId);

            if (updated != 1) {
                throw new IllegalArgumentException(
                        "Mã giảm giá vừa hết lượt sử dụng");
            }
        }

        // 10. Tạo bản ghi thanh toán
        jdbcTemplate.update("""
            INSERT INTO payments (
                order_id,
                payment_method,
                amount,
                payment_status
            )
            VALUES (?, ?, ?, 'PENDING')
            """,
            orderId,
            paymentMethod,
            totalAmount);

        // 11. Ghi lịch sử trạng thái
        jdbcTemplate.update("""
            INSERT INTO order_status_history (
                order_id,
                old_status,
                new_status,
                changed_by,
                note
            )
            VALUES (?, NULL, 'PENDING', ?, ?)
            """,
            orderId,
            userId,
            "Đơn hàng được tạo - " + paymentMethod);

        // 12. Xóa giỏ hàng
        cartItemRepository.deleteByUserId(userId);

        return new CreateOrderResponse(
                orderId,
                "PENDING",
                subtotal,
                shippingFee,
                couponDiscount,
                totalAmount);
    }

    // =====================================================
    // API 14: DANH SÁCH ĐƠN HÀNG
    // =====================================================

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getOrders(Long userId) {

        return jdbcTemplate.queryForList("""
            SELECT
                id AS orderId,
                status,
                subtotal_amount AS subtotalAmount,
                shipping_fee AS shippingFee,
                discount_amount AS discountAmount,
                total_amount AS totalAmount,
                created_at AS createdAt
            FROM orders
            WHERE user_id = ?
            ORDER BY created_at DESC, id DESC
            """, userId);
    }

    // =====================================================
    // CHI TIẾT ĐƠN HÀNG
    // =====================================================

    @Transactional(readOnly = true)
    public Map<String, Object> getOrderDetail(
            Long userId, Long orderId) {

        List<Map<String, Object>> results =
                jdbcTemplate.queryForList("""
                    SELECT
                        o.id AS orderId,
                        o.status,
                        o.receiver_name AS receiverName,
                        o.receiver_phone AS receiverPhone,
                        o.shipping_address AS shippingAddress,
                        o.order_note AS orderNote,
                        o.subtotal_amount AS subtotalAmount,
                        o.shipping_fee AS shippingFee,
                        o.discount_amount AS discountAmount,
                        o.total_amount AS totalAmount,
                        o.coupon_id AS couponId,
                        c.code AS couponCode,
                        p.payment_method AS paymentMethod,
                        p.payment_status AS paymentStatus,
                        o.cancelled_at AS cancelledAt,
                        o.cancel_reason AS cancelReason,
                        o.created_at AS createdAt,
                        o.updated_at AS updatedAt
                    FROM orders o
                    LEFT JOIN coupons c
                        ON c.id = o.coupon_id
                    LEFT JOIN payments p
                        ON p.id = (
                            SELECT MAX(p2.id)
                            FROM payments p2
                            WHERE p2.order_id = o.id
                        )
                    WHERE o.id = ?
                      AND o.user_id = ?
                    """, orderId, userId);

        if (results.isEmpty()) {
            throw new IllegalArgumentException(
                    "Đơn hàng không tồn tại hoặc "
                    + "bạn không có quyền xem");
        }

        return results.get(0);
    }

    // =====================================================
    // DANH SÁCH SẢN PHẨM TRONG ĐƠN
    // =====================================================

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getOrderItems(
            Long userId, Long orderId) {

        assertOrderOwnership(userId, orderId);

        return jdbcTemplate.queryForList("""
            SELECT
                id AS orderDetailId,
                product_variant_id AS productVariantId,
                product_name AS productName,
                product_image_url AS productImageUrl,
                variant_size AS size,
                variant_color AS color,
                quantity,
                unit_price AS unitPrice,
                quantity * unit_price AS lineTotal
            FROM order_details
            WHERE order_id = ?
            ORDER BY id ASC
            """, orderId);
    }

    // =====================================================
    // TRẠNG THÁI ĐƠN HÀNG
    // =====================================================

    @Transactional(readOnly = true)
    public Map<String, Object> getOrderStatus(
            Long userId, Long orderId) {

        List<Map<String, Object>> results =
                jdbcTemplate.queryForList("""
                    SELECT
                        id AS orderId,
                        status,
                        created_at AS createdAt,
                        updated_at AS updatedAt,
                        cancelled_at AS cancelledAt,
                        cancel_reason AS cancelReason
                    FROM orders
                    WHERE id = ?
                      AND user_id = ?
                    """, orderId, userId);

        if (results.isEmpty()) {
            throw new IllegalArgumentException(
                    "Đơn hàng không tồn tại hoặc "
                    + "bạn không có quyền xem");
        }

        return results.get(0);
    }

    // =====================================================
    // LỊCH SỬ TRẠNG THÁI
    // =====================================================

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getOrderStatusHistory(
            Long userId, Long orderId) {

        assertOrderOwnership(userId, orderId);

        return jdbcTemplate.queryForList("""
            SELECT
                id AS historyId,
                old_status AS oldStatus,
                new_status AS newStatus,
                changed_by AS changedBy,
                note,
                created_at AS createdAt
            FROM order_status_history
            WHERE order_id = ?
            ORDER BY created_at ASC, id ASC
            """, orderId);
    }

    // =====================================================
    // HỦY ĐƠN HÀNG
    // =====================================================

    @Transactional
    public Map<String, Object> cancelOrder(
            Long userId,
            Long orderId,
            String reason) {

        // 1. Khóa đơn hàng
        List<Map<String, Object>> orders =
                jdbcTemplate.queryForList("""
                    SELECT
                        id,
                        status,
                        coupon_id
                    FROM orders
                    WHERE id = ?
                      AND user_id = ?
                    FOR UPDATE
                    """, orderId, userId);

        if (orders.isEmpty()) {
            throw new IllegalArgumentException(
                    "Đơn hàng không tồn tại hoặc "
                    + "bạn không có quyền hủy");
        }

        Map<String, Object> order = orders.get(0);

        String oldStatus =
                String.valueOf(order.get("status"));

        if (!"PENDING".equalsIgnoreCase(oldStatus)) {
            throw new IllegalStateException(
                    "Chỉ có thể hủy đơn hàng đang chờ xác nhận");
        }

        // 2. Kiểm tra trạng thái thanh toán.
        // Không tự động hủy đơn đã thanh toán.
        List<Map<String, Object>> payments =
                jdbcTemplate.queryForList("""
                    SELECT id, payment_status
                    FROM payments
                    WHERE order_id = ?
                    FOR UPDATE
                    """, orderId);

        for (Map<String, Object> payment : payments) {

            String paymentStatus =
                    String.valueOf(
                            payment.get("payment_status"));

            if ("PAID".equalsIgnoreCase(paymentStatus)
                    || "SUCCESS".equalsIgnoreCase(paymentStatus)
                    || "COMPLETED".equalsIgnoreCase(paymentStatus)) {

                throw new IllegalStateException(
                        "Đơn hàng đã thanh toán. "
                        + "Vui lòng liên hệ để được hoàn tiền");
            }
        }

        // 3. Lấy sản phẩm trong đơn
        List<Map<String, Object>> items =
                jdbcTemplate.queryForList("""
                    SELECT
                        product_variant_id,
                        quantity
                    FROM order_details
                    WHERE order_id = ?
                    ORDER BY product_variant_id ASC
                    """, orderId);

        // 4. Hoàn tồn kho
        for (Map<String, Object> item : items) {

            Long variantId =
                    ((Number) item.get(
                            "product_variant_id")).longValue();

            int quantity =
                    ((Number) item.get("quantity")).intValue();

            int updated = jdbcTemplate.update("""
                UPDATE product_variants
                SET stock_quantity = stock_quantity + ?
                WHERE id = ?
                """, quantity, variantId);

            if (updated != 1) {
                throw new IllegalStateException(
                        "Không thể hoàn tồn kho biến thể ID: "
                        + variantId);
            }
        }

        // 5. Hoàn lượt sử dụng coupon
        Object couponIdObject = order.get("coupon_id");

        if (couponIdObject != null) {

            Long couponId =
                    ((Number) couponIdObject).longValue();

            int updated = jdbcTemplate.update("""
                UPDATE coupons
                SET used_count = GREATEST(
                    COALESCE(used_count, 0) - 1,
                    0
                )
                WHERE id = ?
                """, couponId);

            if (updated != 1) {
                throw new IllegalStateException(
                        "Không thể hoàn lượt sử dụng coupon");
            }
        }

        // 6. Hủy các payment đang chờ.
        // Không áp dụng với giao dịch đã thanh toán.
        jdbcTemplate.update("""
            UPDATE payments
            SET payment_status = 'CANCELLED',
                updated_at = CURRENT_TIMESTAMP
            WHERE order_id = ?
              AND (
                  payment_status IS NULL
                  OR UPPER(payment_status) = 'PENDING'
              )
            """, orderId);

        // 7. Cập nhật đơn hàng
        int updated = jdbcTemplate.update("""
            UPDATE orders
            SET status = 'CANCELLED',
                cancelled_at = CURRENT_TIMESTAMP,
                cancel_reason = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
              AND user_id = ?
              AND status = 'PENDING'
            """,
            reason,
            orderId,
            userId);

        if (updated != 1) {
            throw new IllegalStateException(
                    "Không thể hủy đơn hàng");
        }

        // 8. Ghi lịch sử
        jdbcTemplate.update("""
            INSERT INTO order_status_history (
                order_id,
                old_status,
                new_status,
                changed_by,
                note
            )
            VALUES (?, ?, 'CANCELLED', ?, ?)
            """,
            orderId,
            oldStatus,
            userId,
            reason);

        Map<String, Object> result =
                new LinkedHashMap<>();

        result.put("orderId", orderId);
        result.put("oldStatus", oldStatus);
        result.put("status", "CANCELLED");
        result.put("cancelReason", reason);

        return result;
    }

    // =====================================================
    // HÀM PHỤ
    // =====================================================

    private void assertOrderOwnership(
            Long userId, Long orderId) {

        List<Long> ids =
                jdbcTemplate.queryForList("""
                    SELECT id
                    FROM orders
                    WHERE id = ?
                      AND user_id = ?
                    """,
                    Long.class,
                    orderId,
                    userId);

        if (ids.isEmpty()) {
            throw new IllegalArgumentException(
                    "Đơn hàng không tồn tại hoặc "
                    + "bạn không có quyền xem");
        }
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
