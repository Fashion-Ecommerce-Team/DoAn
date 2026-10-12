
package ecommerce.checkout.dto;

import java.math.BigDecimal;
import java.util.List;

public class CheckoutPreviewResponse {

    private List<Item> items;
    private int itemCount;
    private BigDecimal subtotal;
    private BigDecimal productDiscount;
    private BigDecimal shippingFee;
    private BigDecimal totalAmount;

    public CheckoutPreviewResponse() {
    }

    public CheckoutPreviewResponse(
            List<Item> items,
            int itemCount,
            BigDecimal subtotal,
            BigDecimal productDiscount,
            BigDecimal shippingFee,
            BigDecimal totalAmount) {
        this.items = items;
        this.itemCount = itemCount;
        this.subtotal = subtotal;
        this.productDiscount = productDiscount;
        this.shippingFee = shippingFee;
        this.totalAmount = totalAmount;
    }

    public List<Item> getItems() {
        return items;
    }

    public void setItems(List<Item> items) {
        this.items = items;
    }

    public int getItemCount() {
        return itemCount;
    }

    public void setItemCount(int itemCount) {
        this.itemCount = itemCount;
    }

    public BigDecimal getSubtotal() {
        return subtotal;
    }

    public void setSubtotal(BigDecimal subtotal) {
        this.subtotal = subtotal;
    }

    public BigDecimal getProductDiscount() {
        return productDiscount;
    }

    public void setProductDiscount(BigDecimal productDiscount) {
        this.productDiscount = productDiscount;
    }

    public BigDecimal getShippingFee() {
        return shippingFee;
    }

    public void setShippingFee(BigDecimal shippingFee) {
        this.shippingFee = shippingFee;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(BigDecimal totalAmount) {
        this.totalAmount = totalAmount;
    }

    public static class Item {

        private Long cartItemId;
        private Long productVariantId;
        private String productName;
        private String size;
        private String color;
        private String imageUrl;
        private int quantity;
        private BigDecimal unitPrice;
        private BigDecimal lineTotal;

        public Item() {
        }

        public Item(
                Long cartItemId,
                Long productVariantId,
                String productName,
                String size,
                String color,
                String imageUrl,
                int quantity,
                BigDecimal unitPrice,
                BigDecimal lineTotal) {
            this.cartItemId = cartItemId;
            this.productVariantId = productVariantId;
            this.productName = productName;
            this.size = size;
            this.color = color;
            this.imageUrl = imageUrl;
            this.quantity = quantity;
            this.unitPrice = unitPrice;
            this.lineTotal = lineTotal;
        }

        public Long getCartItemId() {
            return cartItemId;
        }

        public Long getProductVariantId() {
            return productVariantId;
        }

        public String getProductName() {
            return productName;
        }

        public String getSize() {
            return size;
        }

        public String getColor() {
            return color;
        }

        public String getImageUrl() {
            return imageUrl;
        }

        public int getQuantity() {
            return quantity;
        }

        public BigDecimal getUnitPrice() {
            return unitPrice;
        }

        public BigDecimal getLineTotal() {
            return lineTotal;
        }
    }
}
