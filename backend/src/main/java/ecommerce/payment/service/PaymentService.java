
package ecommerce.payment.service;

import ecommerce.payment.provider.PaymentProvider;

import java.math.BigDecimal;
import java.sql.PreparedStatement;
import java.sql.Statement;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class PaymentService {

    private final JdbcTemplate jdbcTemplate;
    private final PaymentProvider paymentProvider;
    private final int qrExpiryMinutes;

    public PaymentService(
            JdbcTemplate jdbcTemplate,
            PaymentProvider paymentProvider,
            @Value("${payment.vietqr.expiry-minutes:15}")
            int qrExpiryMinutes) {

        this.jdbcTemplate = jdbcTemplate;
        this.paymentProvider = paymentProvider;
        this.qrExpiryMinutes = qrExpiryMinutes;
    }

    // =====================================================
    // API 1: TẠO PAYMENT
    // =====================================================

    @Transactional
    public Map<String, Object> createPayment(
            Long userId,
            Long orderId,
            String paymentMethod) {

        if (userId == null || orderId == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Thông tin người dùng hoặc đơn hàng không hợp lệ");
        }

        if (paymentMethod == null || paymentMethod.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Phương thức thanh toán không được để trống");
        }

        String method = paymentMethod.trim().toUpperCase();

        if (!method.equals("COD") && !method.equals("VIETQR")) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Chỉ hỗ trợ COD hoặc VIETQR");
        }

        // Khóa Order để tránh tạo Payment trùng.
        Map<String, Object> order = findOrderForUpdate(
                userId, orderId);

        String orderStatus =
                String.valueOf(order.get("status"));

        if (!"PENDING".equalsIgnoreCase(orderStatus)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Đơn hàng không còn ở trạng thái PENDING");
        }

        // Nếu đã có Payment, trả về bản ghi hiện có
        // nếu phương thức thanh toán trùng khớp.
        List<Map<String, Object>> existingPayments =
                jdbcTemplate.queryForList("""
                    SELECT id, payment_method
                    FROM payments
                    WHERE order_id = ?
                    ORDER BY id DESC
                    FOR UPDATE
                    """, orderId);

        if (!existingPayments.isEmpty()) {

            Map<String, Object> existing =
                    existingPayments.get(0);

            String existingMethod =
                    String.valueOf(
                            existing.get("payment_method"));

            if (!method.equalsIgnoreCase(existingMethod)) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "Đơn hàng đã có phương thức thanh toán khác");
            }

            Long existingId =
                    ((Number) existing.get("id")).longValue();

            return getPaymentDetail(userId, existingId);
        }

        BigDecimal amount =
                toBigDecimal(order.get("total_amount"));

        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Số tiền đơn hàng không hợp lệ");
        }

        String sql = """
            INSERT INTO payments (
                order_id,
                payment_method,
                amount,
                payment_status,
                created_at,
                updated_at
            )
            VALUES (?, ?, ?, 'PENDING', NOW(), NOW())
            """;

        KeyHolder keyHolder = new GeneratedKeyHolder();

        jdbcTemplate.update(connection -> {

            PreparedStatement ps =
                    connection.prepareStatement(
                            sql,
                            Statement.RETURN_GENERATED_KEYS);

            ps.setLong(1, orderId);
            ps.setString(2, method);
            ps.setBigDecimal(3, amount);

            return ps;

        }, keyHolder);

        Number generatedId = keyHolder.getKey();

        if (generatedId == null) {
            throw new IllegalStateException(
                    "Không lấy được ID Payment vừa tạo");
        }

        return getPaymentDetail(
                userId,
                generatedId.longValue());
    }

    // =====================================================
    // API 2: LẤY CHI TIẾT PAYMENT
    // =====================================================

    @Transactional(readOnly = true)
    public Map<String, Object> getPaymentDetail(
            Long userId,
            Long paymentId) {

        String sql = """
            SELECT
                p.id,
                p.order_id,
                p.payment_method,
                p.amount,
                p.payment_status,
                p.transaction_id,
                p.qr_code_url,
                p.expired_at,
                p.paid_at,
                p.created_at,
                p.updated_at
            FROM payments p
            INNER JOIN orders o
                ON p.order_id = o.id
            WHERE p.id = ?
              AND o.user_id = ?
            """;

        try {
            return jdbcTemplate.queryForMap(
                    sql,
                    paymentId,
                    userId);

        } catch (EmptyResultDataAccessException e) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Không tìm thấy Payment hoặc không có quyền truy cập");
        }
    }

    // =====================================================
    // API 3: LẤY TRẠNG THÁI PAYMENT
    // =====================================================

    @Transactional(readOnly = true)
    public Map<String, Object> getPaymentStatus(
            Long userId,
            Long paymentId) {

        String sql = """
            SELECT
                p.id,
                p.order_id,
                p.payment_method,
                p.payment_status,
                p.transaction_id,
                p.amount,
                p.paid_at,
                p.expired_at,
                p.updated_at,
                o.status AS order_status
            FROM payments p
            INNER JOIN orders o
                ON p.order_id = o.id
            WHERE p.id = ?
              AND o.user_id = ?
            """;

        try {
            return jdbcTemplate.queryForMap(
                    sql,
                    paymentId,
                    userId);

        } catch (EmptyResultDataAccessException e) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Không tìm thấy trạng thái Payment");
        }
    }

    // =====================================================
    // API 4: TẠO MÃ QR VIETQR
    // =====================================================

    @Transactional
    public Map<String, Object> createQrPayment(
            Long userId,
            Long paymentId) {

        // Khóa Order trước Payment để đồng bộ
        // với luồng hủy đơn và callback.
        Map<String, Object> payment =
                findPaymentWithOrderLock(
                        userId,
                        paymentId);

        String method =
                String.valueOf(
                        payment.get("payment_method"));

        String paymentStatus =
                String.valueOf(
                        payment.get("payment_status"));

        String orderStatus =
                String.valueOf(
                        payment.get("order_status"));

        if (!"VIETQR".equalsIgnoreCase(method)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Chỉ Payment VIETQR mới được tạo QR");
        }

        if (!"PENDING".equalsIgnoreCase(orderStatus)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Đơn hàng không còn chờ xử lý");
        }

        if (!"PENDING".equalsIgnoreCase(paymentStatus)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Payment không còn chờ thanh toán");
        }

        LocalDateTime expiredAt =
                toLocalDateTime(
                        payment.get("expired_at"));

        if (expiredAt != null
                && !expiredAt.isAfter(LocalDateTime.now())) {

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Mã QR đã hết thời hạn thanh toán");
        }

        Object existingQr =
                payment.get("qr_code_url");

        if (existingQr != null
                && !existingQr.toString().isBlank()) {

            return getPaymentDetail(userId, paymentId);
        }

        if (qrExpiryMinutes <= 0) {
            throw new IllegalStateException(
                    "Thời hạn QR phải lớn hơn 0");
        }

        BigDecimal amount =
                toBigDecimal(payment.get("amount"));

        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Số tiền Payment không hợp lệ");
        }

        String description = "PAY" + paymentId;

        String qrCodeUrl =
                paymentProvider.createQrCode(
                        paymentId,
                        amount,
                        description);

        LocalDateTime newExpiredAt =
                LocalDateTime.now()
                        .plusMinutes(qrExpiryMinutes);

        int updated = jdbcTemplate.update("""
            UPDATE payments
            SET qr_code_url = ?,
                expired_at = ?,
                updated_at = NOW()
            WHERE id = ?
              AND payment_status = 'PENDING'
            """,
            qrCodeUrl,
            Timestamp.valueOf(newExpiredAt),
            paymentId);

        if (updated != 1) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Không thể lưu mã QR");
        }

        return getPaymentDetail(userId, paymentId);
    }

    // =====================================================
    // API 5: CALLBACK THANH TOÁN
    // =====================================================

    @Transactional
    public Map<String, Object> handlePaymentCallback(
            Long paymentId,
            String transactionId,
            String paymentStatus) {

        if (paymentId == null || paymentId <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Payment ID không hợp lệ");
        }

        if (transactionId == null
                || transactionId.isBlank()) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Transaction ID không được để trống");
        }

        if (paymentStatus == null
                || paymentStatus.isBlank()) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Trạng thái thanh toán không được để trống");
        }

        String status =
                paymentStatus.trim().toUpperCase();

        String normalizedTransactionId =
                transactionId.trim();

        if (!"PAID".equals(status)
                && !"FAILED".equals(status)) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Chỉ hỗ trợ trạng thái PAID hoặc FAILED");
        }

        // Khóa Order trước Payment.
        // Giảm nguy cơ xung đột với hủy đơn.
        Map<String, Object> payment =
                findPaymentWithOrderLockForCallback(
                        paymentId);

        String method =
                String.valueOf(
                        payment.get("payment_method"));

        String currentStatus =
                String.valueOf(
                        payment.get("payment_status"));

        String orderStatus =
                String.valueOf(
                        payment.get("order_status"));

        String existingTransactionId =
                payment.get("transaction_id") == null
                ? null
                : payment.get("transaction_id").toString();

        if (!"VIETQR".equalsIgnoreCase(method)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Callback chỉ hỗ trợ VIETQR");
        }

        // Callback PAID trùng với cùng transactionId
        // được trả về kết quả cũ.
        if ("PAID".equalsIgnoreCase(currentStatus)) {

            if ("PAID".equals(status)
                    && normalizedTransactionId.equals(
                            existingTransactionId)) {

                return getPaymentWithoutUser(paymentId);
            }

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Payment đã được thanh toán");
        }

        if (!"PENDING".equalsIgnoreCase(currentStatus)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Payment không còn ở trạng thái PENDING");
        }

        if (!"PENDING".equalsIgnoreCase(orderStatus)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Đơn hàng không còn chờ xử lý");
        }

        // Chống dùng lại cùng transactionId
        // cho một Payment khác.
        List<Long> duplicateTransactions =
                jdbcTemplate.queryForList("""
                    SELECT id
                    FROM payments
                    WHERE transaction_id = ?
                      AND id <> ?
                    LIMIT 1
                    """,
                    Long.class,
                    normalizedTransactionId,
                    paymentId);

        if (!duplicateTransactions.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Mã giao dịch đã được sử dụng");
        }

        int updated = jdbcTemplate.update("""
            UPDATE payments
            SET payment_status = ?,
                transaction_id = ?,
                paid_at = CASE
                    WHEN ? = 'PAID' THEN NOW()
                    ELSE NULL
                END,
                updated_at = NOW()
            WHERE id = ?
              AND payment_status = 'PENDING'
            """,
            status,
            normalizedTransactionId,
            status,
            paymentId);

        if (updated != 1) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Không thể cập nhật Payment");
        }

        // Không chuyển Order sang COMPLETED ở đây.
        // Order status và Payment status là hai luồng khác nhau.
        return getPaymentWithoutUser(paymentId);
    }

    // =====================================================
    // API 6: LẤY PAYMENT THEO ORDER ID
    // =====================================================

    @Transactional(readOnly = true)
    public Map<String, Object> getPaymentByOrder(
            Long userId,
            Long orderId) {

        String sql = """
            SELECT
                p.id,
                p.order_id,
                p.payment_method,
                p.amount,
                p.payment_status,
                p.transaction_id,
                p.qr_code_url,
                p.expired_at,
                p.paid_at,
                p.created_at,
                p.updated_at
            FROM payments p
            INNER JOIN orders o
                ON p.order_id = o.id
            WHERE o.id = ?
              AND o.user_id = ?
            ORDER BY p.id DESC
            LIMIT 1
            """;

        try {
            return jdbcTemplate.queryForMap(
                    sql,
                    orderId,
                    userId);

        } catch (EmptyResultDataAccessException e) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Không tìm thấy Payment của đơn hàng");
        }
    }

    // =====================================================
    // PRIVATE METHODS
    // =====================================================

    private Map<String, Object> findOrderForUpdate(
            Long userId,
            Long orderId) {

        try {
            return jdbcTemplate.queryForMap("""
                SELECT
                    id,
                    total_amount,
                    status
                FROM orders
                WHERE id = ?
                  AND user_id = ?
                FOR UPDATE
                """,
                orderId,
                userId);

        } catch (EmptyResultDataAccessException e) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Không tìm thấy đơn hàng");
        }
    }

    private Map<String, Object> findPaymentWithOrderLock(
            Long userId,
            Long paymentId) {

        // Đọc orderId trước, sau đó khóa Order.
        Long orderId = findOrderIdByPayment(paymentId);

        findOrderForUpdate(userId, orderId);

        try {
            return jdbcTemplate.queryForMap("""
                SELECT
                    p.id,
                    p.order_id,
                    p.payment_method,
                    p.amount,
                    p.payment_status,
                    p.qr_code_url,
                    p.expired_at,
                    o.status AS order_status
                FROM payments p
                INNER JOIN orders o
                    ON o.id = p.order_id
                WHERE p.id = ?
                  AND o.user_id = ?
                FOR UPDATE
                """,
                paymentId,
                userId);

        } catch (EmptyResultDataAccessException e) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Không tìm thấy Payment");
        }
    }

    private Map<String, Object>
            findPaymentWithOrderLockForCallback(
                    Long paymentId) {

        Long orderId = findOrderIdByPayment(paymentId);

        // Khóa Order trước.
        jdbcTemplate.queryForList("""
            SELECT id
            FROM orders
            WHERE id = ?
            FOR UPDATE
            """, orderId);

        try {
            return jdbcTemplate.queryForMap("""
                SELECT
                    p.id,
                    p.order_id,
                    p.payment_method,
                    p.payment_status,
                    p.transaction_id,
                    o.status AS order_status
                FROM payments p
                INNER JOIN orders o
                    ON o.id = p.order_id
                WHERE p.id = ?
                FOR UPDATE
                """, paymentId);

        } catch (EmptyResultDataAccessException e) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Không tìm thấy Payment");
        }
    }

    private Long findOrderIdByPayment(Long paymentId) {

        try {
            return jdbcTemplate.queryForObject("""
                SELECT order_id
                FROM payments
                WHERE id = ?
                """,
                Long.class,
                paymentId);

        } catch (EmptyResultDataAccessException e) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Payment không tồn tại");
        }
    }

    private Map<String, Object> getPaymentWithoutUser(
            Long paymentId) {

        return jdbcTemplate.queryForMap("""
            SELECT
                id,
                order_id,
                payment_method,
                amount,
                payment_status,
                transaction_id,
                qr_code_url,
                expired_at,
                paid_at,
                created_at,
                updated_at
            FROM payments
            WHERE id = ?
            """, paymentId);
    }

    private BigDecimal toBigDecimal(Object value) {

        if (value == null) {
            throw new IllegalArgumentException(
                    "Số tiền không được để trống");
        }

        return new BigDecimal(value.toString());
    }

    private LocalDateTime toLocalDateTime(Object value) {

        if (value instanceof Timestamp timestamp) {
            return timestamp.toLocalDateTime();
        }

        if (value instanceof LocalDateTime dateTime) {
            return dateTime;
        }

        return null;
    }
}
