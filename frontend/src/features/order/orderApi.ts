
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

  getOrderDetail: async (orderId: number) => {
    const response = await apiClient.get(
      `/orders/${orderId}`
    );

    return response.data.data;
  },
};
