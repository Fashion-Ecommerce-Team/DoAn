
package ecommerce.payment.dto;

import jakarta.validation.constraints.NotNull;

public class CreateQrRequest {

    @NotNull(message = "ID giao dịch không được để trống")
    private Long paymentId;

    public Long getPaymentId() {
        return paymentId;
    }

    public void setPaymentId(Long paymentId) {
        this.paymentId = paymentId;
    }
}
