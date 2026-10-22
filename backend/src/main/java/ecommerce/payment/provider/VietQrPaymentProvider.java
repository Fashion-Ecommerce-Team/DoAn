
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

        if (bankId.isBlank()
                || accountNo.isBlank()
                || accountName.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Chưa cấu hình thông tin ngân hàng VietQR");
        }

        String encodedName = URLEncoder.encode(
                accountName, StandardCharsets.UTF_8);

        String encodedDescription = URLEncoder.encode(
                description, StandardCharsets.UTF_8);

        return "https://img.vietqr.io/image/"
                + bankId + "-" + accountNo
                + "-compact2.png"
                + "?amount=" + amount.toBigInteger()
                + "&addInfo=" + encodedDescription
                + "&accountName=" + encodedName;
    }
}
