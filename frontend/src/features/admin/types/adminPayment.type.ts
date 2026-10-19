export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'EXPIRED' | 'REFUNDED';

export interface PaymentResponse {
  id: number;
  orderId: number;
  paymentMethod: string;
  amount: number;
  paymentStatus: PaymentStatus | string;
  transactionId?: string;
  qrCodeUrl?: string;
  paymentResponse?: string;
  expiredAt?: string;
  paidAt?: string;
  createdAt: string;
  updatedAt?: string;

  // Thông tin đơn hàng liên quan
  receiverName?: string;
  receiverPhone?: string;
  orderTotalAmount?: number;
  orderStatus?: string;
}
