
package ecommerce.payment.service;

import ecommerce.payment.provider.PaymentProvider;

import java.math.BigDecimal;
import java.sql.PreparedStatement;
import java.sql.Statement;
import java.util.Map;

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

    public PaymentService(
            JdbcTemplate jdbcTemplate,
            PaymentProvider paymentProvider) {
        this.jdbcTemplate = jdbcTemplate;
        this.paymentProvider = paymentProvider;
    }

    // API 1: Tạo bản ghi thanh toán
    @Transactional
    public Map<String, Object> createPayment(
            Long userId,
            Long orderId,
            String paymentMethod) {

        if (paymentMethod == null || paymentMethod.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Phương thức thanh toán không được để trống");
        }

        String method = paymentMethod.trim().toUpperCase();

        if (!method.equals("COD") && !method.equals("VIETQR")) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Phương thức thanh toán chỉ được là COD hoặc VIETQR");
        }

        Map<String, Object> order;

        try {
            order = jdbcTemplate.queryForMap(
                    """
                    SELECT id, total_amount
                    FROM orders
                    WHERE id = ? AND user_id = ?
                    """,
                    orderId, userId);
        } catch (EmptyResultDataAccessException e) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Không tìm thấy đơn hàng hoặc bạn không có quyền truy cập");
        }

        BigDecimal amount = new BigDecimal(
                order.get("total_amount").toString());

        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Số tiền đơn hàng không hợp lệ");
        }

        String sql = """
                INSERT INTO payments
                    (order_id, payment_method, amount, payment_status,
                     created_at, updated_at)
                VALUES (?, ?, ?, 'PENDING', NOW(), NOW())
                """;

        KeyHolder keyHolder = new GeneratedKeyHolder();

        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(
                    sql, Statement.RETURN_GENERATED_KEYS);
            ps.setLong(1, orderId);
            ps.setString(2, method);
            ps.setBigDecimal(3, amount);
            return ps;
        }, keyHolder);

        Number generatedId = keyHolder.getKey();

        if (generatedId == null) {
            throw new IllegalStateException(
                    "Không lấy được ID giao dịch thanh toán");
        }

        return getPaymentDetail(userId, generatedId.longValue());
    }

    // API 2: Lấy chi tiết giao dịch
    public Map<String, Object> getPaymentDetail(
            Long userId, Long paymentId) {

        String sql = """
                SELECT p.id, p.order_id, p.payment_method,
                       p.amount, p.payment_status, p.transaction_id,
                       p.qr_code_url, p.expired_at, p.paid_at,
                       p.created_at, p.updated_at
                FROM payments p
                INNER JOIN orders o ON p.order_id = o.id
                WHERE p.id = ? AND o.user_id = ?
                """;

        try {
            return jdbcTemplate.queryForMap(sql, paymentId, userId);
        } catch (EmptyResultDataAccessException e) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Không tìm thấy giao dịch hoặc bạn không có quyền truy cập");
        }
    }

    // API 3: Kiểm tra trạng thái thanh toán
    public Map<String, Object> getPaymentStatus(
            Long userId, Long paymentId) {

        String sql = """
                SELECT p.id, p.order_id, p.payment_method,
                       p.payment_status, p.transaction_id,
                       p.amount, p.paid_at, p.expired_at, p.updated_at
                FROM payments p
                INNER JOIN orders o ON p.order_id = o.id
                WHERE p.id = ? AND o.user_id = ?
                """;

        try {
            return jdbcTemplate.queryForMap(sql, paymentId, userId);
        } catch (EmptyResultDataAccessException e) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Không tìm thấy giao dịch hoặc bạn không có quyền truy cập");
        }
    }

    // API 4: Tạo thông tin thanh toán QR
    @Transactional
    public Map<String, Object> createQrPayment(
            Long userId, Long paymentId) {

        Map<String, Object> payment;

        try {
            payment = jdbcTemplate.queryForMap(
                    """
                    SELECT p.id, p.order_id, p.payment_method,
                           p.amount, p.payment_status, p.qr_code_url
                    FROM payments p
                    INNER JOIN orders o ON p.order_id = o.id
                    WHERE p.id = ? AND o.user_id = ?
                    """,
                    paymentId, userId);
        } catch (EmptyResultDataAccessException e) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Không tìm thấy giao dịch hoặc bạn không có quyền truy cập");
        }

        String method = payment.get("payment_method").toString();
        String status = payment.get("payment_status").toString();

        if (!method.equalsIgnoreCase("VIETQR")) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Chỉ giao dịch VIETQR mới được tạo mã QR");
        }

        if (!status.equalsIgnoreCase("PENDING")) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Chỉ tạo QR cho giao dịch đang chờ thanh toán");
        }

        Object existingQr = payment.get("qr_code_url");

        if (existingQr != null
                && !existingQr.toString().isBlank()) {
            return getPaymentDetail(userId, paymentId);
        }

        BigDecimal amount = new BigDecimal(
                payment.get("amount").toString());

        String description = "PAY" + paymentId;

        String qrCodeUrl = paymentProvider.createQrCode(
                paymentId, amount, description);

        jdbcTemplate.update(
                """
                UPDATE payments
                SET qr_code_url = ?, updated_at = NOW()
                WHERE id = ? AND payment_status = 'PENDING'
                """,
                qrCodeUrl, paymentId);

        return getPaymentDetail(userId, paymentId);
    }
    // API 5: Nhận kết quả thanh toán từ callback
@Transactional
public Map<String, Object> handlePaymentCallback(
        Long paymentId,
        String transactionId,
        String paymentStatus) {

    // 1. Kiểm tra dữ liệu đầu vào
    if (paymentId == null) {
        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "paymentId không được để trống");
    }

    if (transactionId == null || transactionId.isBlank()) {
        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "transactionId không được để trống");
    }

    if (paymentStatus == null || paymentStatus.isBlank()) {
        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "paymentStatus không được để trống");
    }

    String status = paymentStatus.trim().toUpperCase();

    if (!status.equals("PAID") && !status.equals("FAILED")) {
        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Trạng thái thanh toán chỉ được là PAID hoặc FAILED");
    }

    // 2. Khóa bản ghi để hạn chế hai callback cập nhật đồng thời
    Map<String, Object> payment;

    try {
        payment = jdbcTemplate.queryForMap(
                """
                SELECT id, payment_method, payment_status, transaction_id
                FROM payments
                WHERE id = ?
                FOR UPDATE
                """,
                paymentId);
    } catch (EmptyResultDataAccessException e) {
        throw new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "Không tìm thấy giao dịch thanh toán");
    }

    String method = payment.get("payment_method").toString();
    String currentStatus = payment.get("payment_status").toString();

    // 3. Chỉ xử lý callback cho giao dịch VietQR
    if (!method.equalsIgnoreCase("VIETQR")) {
        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Callback chỉ áp dụng cho giao dịch VIETQR");
    }

    // 4. Nếu đã thanh toán thành công thì không cho thay đổi kết quả
    if (currentStatus.equalsIgnoreCase("PAID")) {
        Object existingTransactionId = payment.get("transaction_id");

        if (status.equals("PAID")
                && existingTransactionId != null
                && transactionId.trim().equals(
                        existingTransactionId.toString())) {
            // Callback thành công gửi lại cùng giao dịch: xử lý idempotent
            return jdbcTemplate.queryForMap(
                    """
                    SELECT id, order_id, payment_method, amount,
                           payment_status, transaction_id,
                           qr_code_url, expired_at, paid_at,
                           created_at, updated_at
                    FROM payments
                    WHERE id = ?
                    """,
                    paymentId);
        }

        throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "Giao dịch đã thanh toán thành công");
    }

    // 5. Chỉ cập nhật giao dịch đang chờ thanh toán
    if (!currentStatus.equalsIgnoreCase("PENDING")) {
        throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "Giao dịch không còn ở trạng thái chờ thanh toán");
    }

    // 6. Cập nhật kết quả giao dịch
    int updated = jdbcTemplate.update(
            """
            UPDATE payments
            SET payment_status = ?,
                transaction_id = ?,
                paid_at = CASE
                    WHEN ? = 'PAID' THEN NOW()
                    ELSE NULL
                END,
                updated_at = NOW()
            WHERE id = ? AND payment_status = 'PENDING'
            """,
            status,
            transactionId.trim(),
            status,
            paymentId);

    if (updated != 1) {
        throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "Không thể cập nhật trạng thái giao dịch");
    }

    // 7. Trả về thông tin thanh toán sau cập nhật
    return jdbcTemplate.queryForMap(
            """
            SELECT id, order_id, payment_method, amount,
                   payment_status, transaction_id,
                   qr_code_url, expired_at, paid_at,
                   created_at, updated_at
            FROM payments
            WHERE id = ?
            """,
            paymentId);
}
}
