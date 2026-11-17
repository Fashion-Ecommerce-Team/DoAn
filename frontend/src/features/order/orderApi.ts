import apiClient from '@/config/axios';

export type PaymentMethod = 'COD' | 'VIETQR';

export interface CreateOrderRequest {
  addressId: number;
  couponCode?: string | null;
  orderNote?: string | null;
  paymentMethod: PaymentMethod;
}

export interface CreateOrderResponse {
  orderId: number;
  status: string;
  subtotal: number;
  shippingFee: number;
  couponDiscount: number;
  totalAmount: number;
}

export interface OrderSummary {
  orderId: number;
  status: string;
  subtotalAmount: number;
  shippingFee: number;
  discountAmount: number;
  totalAmount: number;
  createdAt: string;
}

export interface OrderDetail {
  orderId: number;
  status: string;
  receiverName: string;
  receiverPhone: string;
  shippingAddress: string;
  orderNote?: string | null;
  subtotalAmount: number;
  shippingFee: number;
  discountAmount: number;
  totalAmount: number;
  couponId?: number | null;
  couponCode?: string | null;
  paymentMethod?: string | null;
  paymentStatus?: string | null;
  cancelledAt?: string | null;
  cancelReason?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface OrderItem {
  orderDetailId: number;
  productVariantId: number;
  productName: string;
  productImageUrl?: string | null;
  size?: string | null;
  color?: string | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface OrderStatusHistoryItem {
  historyId: number;
  oldStatus?: string | null;
  newStatus: string;
  changedBy?: number | null;
  note?: string | null;
  createdAt: string;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export const orderApi = {
  createOrder: async (
    request: CreateOrderRequest
  ): Promise<CreateOrderResponse> => {
    const response = await apiClient.post<
      ApiResponse<CreateOrderResponse>
    >('/orders', request);

    return response.data.data;
  },

  getOrders: async (): Promise<OrderSummary[]> => {
    const response = await apiClient.get<ApiResponse<OrderSummary[]>>('/orders');
    return response.data.data || [];
  },

  getOrderDetail: async (orderId: number): Promise<OrderDetail> => {
    const response = await apiClient.get<ApiResponse<OrderDetail>>(
      `/orders/${orderId}`
    );

    return response.data.data;
  },

  getOrderItems: async (orderId: number): Promise<OrderItem[]> => {
    const response = await apiClient.get<ApiResponse<OrderItem[]>>(
      `/orders/${orderId}/items`
    );

    return response.data.data || [];
  },

  getOrderStatusHistory: async (
    orderId: number
  ): Promise<OrderStatusHistoryItem[]> => {
    const response = await apiClient.get<ApiResponse<OrderStatusHistoryItem[]>>(
      `/orders/${orderId}/status-history`
    );

    return response.data.data || [];
  },

  cancelOrder: async (orderId: number, reason: string) => {
    const response = await apiClient.patch<ApiResponse<Record<string, unknown>>>(
      `/orders/${orderId}/cancel`,
      { reason }
    );

    return response.data.data;
  },
};
