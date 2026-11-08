
import apiClient from '@/config/axios';

export type PaymentStatus =
  | 'PENDING'
  | 'PAID'
  | 'FAILED'
  | 'CANCELLED';

export interface PaymentResponse {
  id: number;
  order_id: number;
  payment_method: 'COD' | 'VIETQR';
  amount: number;
  payment_status: PaymentStatus;
  transaction_id: string | null;
  qr_code_url: string | null;
  expired_at: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaymentStatusResponse {
  id: number;
  order_id: number;
  payment_method: 'COD' | 'VIETQR';
  payment_status: PaymentStatus;
  transaction_id: string | null;
  amount: number;
  paid_at: string | null;
  expired_at: string | null;
  updated_at: string;
  order_status: string;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export const paymentApi = {
  // Lấy Payment đã được tạo bởi OrderService
  getByOrder: async (
    orderId: number
  ): Promise<PaymentResponse> => {
    const response = await apiClient.get<
      ApiResponse<PaymentResponse>
    >(`/payments/order/${orderId}`);

    return response.data.data;
  },

  // Tạo QR cho Payment VIETQR
  createQr: async (
    paymentId: number
  ): Promise<PaymentResponse> => {
    const response = await apiClient.post<
      ApiResponse<PaymentResponse>
    >('/payments/qr', {
      paymentId,
    });

    return response.data.data;
  },

  // Kiểm tra trạng thái thanh toán
  getStatus: async (
    paymentId: number
  ): Promise<PaymentStatusResponse> => {
    const response = await apiClient.get<
      ApiResponse<PaymentStatusResponse>
    >(`/payments/${paymentId}/status`);

    return response.data.data;
  },

  // Lấy chi tiết Payment
  getDetail: async (
    paymentId: number
  ): Promise<PaymentResponse> => {
    const response = await apiClient.get<
      ApiResponse<PaymentResponse>
    >(`/payments/${paymentId}`);

    return response.data.data;
  },
};
