import apiClient from '../../config/axios';

export interface CouponValidateResponse {
  valid: boolean;
  couponCode: string;
  subtotal: number;
  discountAmount: number;
  shippingFee: number;
  totalAmount: number;
  message: string;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

const couponApi = {
  validate: async (
    couponCode: string
  ): Promise<CouponValidateResponse> => {
    const response = await apiClient.post<
      ApiResponse<CouponValidateResponse>
    >('/coupons/validate', { couponCode });

    return response.data.data;
  },
};

export default couponApi;