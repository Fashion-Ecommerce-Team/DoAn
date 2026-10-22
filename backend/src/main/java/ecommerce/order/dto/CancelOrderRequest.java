
package ecommerce.order.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class CancelOrderRequest {

    @NotBlank(message = "Lý do hủy không được để trống")
    @Size(max = 500, message = "Lý do hủy không được vượt quá 500 ký tự")
    private String reason;

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }
}
