
import apiClient from '../../config/axios';

interface ApiResponse<T> {
  message: string;
  data: T;
}

export interface CheckoutItem {
  cartItemId: number;
  productVariantId: number;
  productName: string;
  size: string | null;
  color: string | null;
  imageUrl: string | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface CheckoutPreviewResponse {
  items: CheckoutItem[];
  itemCount: number;
  subtotal: number;
  productDiscount: number;
  shippingFee: number;
  totalAmount: number;
}

export interface CheckoutValidateRequest {
  addressId: number;
  couponCode?: string;
}

export interface CheckoutValidateResponse {
  valid?: boolean;
  message?: string;
  [key: string]: unknown;
}
export interface CheckoutAddress {
  id: number;
  user_id: number;
  receiver_name: string;
  receiver_phone: string;
  province: string;
  district: string;
  ward: string;
  street_address: string;
  is_default: number | boolean;
  created_at?: string;
}

export interface CreateCheckoutAddressRequest {
  receiverName: string;
  receiverPhone: string;
  province: string;
  district: string;
  ward: string;
  streetAddress: string;
}

const checkoutApi = {
  preview: async (): Promise<CheckoutPreviewResponse> => {
    const response = await apiClient.post<
      ApiResponse<CheckoutPreviewResponse>
    >('/checkout/preview');

    return response.data.data;
  },

  validate: async (
    request: CheckoutValidateRequest
  ): Promise<CheckoutValidateResponse> => {
    const response = await apiClient.post<
      ApiResponse<CheckoutValidateResponse>
    >('/checkout/validate', request);

    return response.data.data;
  },
createAddress: async (
  request: CreateCheckoutAddressRequest
): Promise<CheckoutAddress> => {
  const response = await apiClient.post<
    ApiResponse<CheckoutAddress>
  >('/checkout/addresses', request);

  return response.data.data;
},
  getAddresses: async (): Promise<CheckoutAddress[]> => {
    const response = await apiClient.get<
      ApiResponse<CheckoutAddress[]>
    >('/checkout/addresses');

    return response.data.data;
  },
};

export default checkoutApi;
