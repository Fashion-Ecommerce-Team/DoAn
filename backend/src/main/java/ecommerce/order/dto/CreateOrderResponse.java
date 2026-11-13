
package ecommerce.order.dto;

import java.math.BigDecimal;

public class CreateOrderResponse {

    private Long orderId;
    private String status;
    private BigDecimal subtotalAmount;
    private BigDecimal shippingFee;
    private BigDecimal discountAmount;
    private BigDecimal totalAmount;

    public CreateOrderResponse(
            Long orderId,
            String status,
            BigDecimal subtotalAmount,
            BigDecimal shippingFee,
            BigDecimal discountAmount,
            BigDecimal totalAmount) {
        this.orderId = orderId;
        this.status = status;
        this.subtotalAmount = subtotalAmount;
        this.shippingFee = shippingFee;
        this.discountAmount = discountAmount;
        this.totalAmount = totalAmount;
    }

    public Long getOrderId() {
        return orderId;
    }

    public String getStatus() {
        return status;
    }

    public BigDecimal getSubtotalAmount() {
        return subtotalAmount;
    }

    public BigDecimal getShippingFee() {
        return shippingFee;
    }

    public BigDecimal getDiscountAmount() {
        return discountAmount;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }
}
