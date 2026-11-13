
package ecommerce.payment.provider;

import java.math.BigDecimal;

public interface PaymentProvider {

    String createQrCode(
            Long paymentId,
            BigDecimal amount,
            String description
    );
}
