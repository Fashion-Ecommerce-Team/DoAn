
package ecommerce.payment.provider;

import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

@Component
public class VietQrPaymentProvider implements PaymentProvider {

    @Value("${payment.vietqr.bank-id:}")
    private String bankId;

    @Value("${payment.vietqr.account-no:}")
    private String accountNo;

    @Value("${payment.vietqr.account-name:}")
    private String accountName;

    @Override
    public String createQrCode(
            Long paymentId,
            BigDecimal amount,
            String description) {

        if (paymentId == null || paymentId <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Payment ID không hợp lệ");
        }

        if (bankId == null || bankId.isBlank()
                || accountNo == null || accountNo.isBlank()
                || accountName == null || accountName.isBlank()) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Chưa cấu hình thông tin ngân hàng VietQR");
        }

        if (!bankId.trim().matches("[A-Za-z0-9]{2,20}")
                || !accountNo.trim().matches("[0-9]{6,19}")) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Mã ngân hàng hoặc số tài khoản không hợp lệ");
        }

        if (amount == null
                || amount.compareTo(BigDecimal.ZERO) <= 0
                || amount.stripTrailingZeros().scale() > 0) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Số tiền thanh toán không hợp lệ");
        }

        String transferContent =
                description == null || description.isBlank()
                ? "PAY" + paymentId
                : description.trim();

        String encodedName = URLEncoder.encode(
                accountName.trim(),
                StandardCharsets.UTF_8);

        String encodedDescription = URLEncoder.encode(
                transferContent,
                StandardCharsets.UTF_8);

        return "https://img.vietqr.io/image/"
                + bankId.trim()
                + "-"
                + accountNo.trim()
                + "-compact2.png"
                + "?amount=" + amount.toBigIntegerExact()
                + "&addInfo=" + encodedDescription
                + "&accountName=" + encodedName;
    }
}
