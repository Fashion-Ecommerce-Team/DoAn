export interface OrderDetailItem {
  id: number;
  productVariantId: number;
  productName: string;
  productImageUrl?: string;
  variantSize?: string;
  variantColor?: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'COMPLETED' | 'CANCELLED';

export interface OrderStatusHistoryItem {
  id?: number;
  orderId?: number;
  oldStatus?: string;
  newStatus: OrderStatus | string;
  changedBy?: number;
  changedByName?: string;
  note?: string;
  createdAt: string;
}

export interface OrderResponse {
  id: number;
  userId: number;
  couponId?: number;
  receiverName?: string;
  receiverPhone?: string;
  shippingAddress?: string;
  customerDefaultAddress?: string;
  orderNote?: string;
  subtotalAmount?: number;
  shippingFee?: number;
  discountAmount?: number;
  totalAmount: number;
  status: OrderStatus | string;
  cancelledAt?: string;
  cancelReason?: string;
  
  // Payment info
  paymentMethod?: string;
  paymentStatus?: string;
  transactionId?: string;
  paidAt?: string;

  createdAt: string;
  updatedAt?: string;
  items?: OrderDetailItem[];
  statusHistory?: OrderStatusHistoryItem[];
}
