
import apiClient from '../../config/axios';

export interface CartItem {
  id: number;
  productVariantId: number;
  quantity: number;
  createdAt: string;
  updatedAt: string;
  productId: number | null;
  productName: string | null;
  imageUrl: string | null;
  size: string | null;
  color: string | null;
  price: number | null;
  stockQuantity: number | null;
}

interface ApiResponse<T> {
  message: string;
  data: T;
}

const cartApi = {
  getCart: async (): Promise<CartItem[]> => {
    const res = await apiClient.get<ApiResponse<CartItem[]>>('/cart');
    return res.data.data;
  },

  getCartCount: async (): Promise<number> => {
    const res = await apiClient.get<ApiResponse<number>>('/cart/count');
    return res.data.data;
  },

  addItem: async (productVariantId: number, quantity: number) => {
    const res = await apiClient.post<ApiResponse<CartItem>>(
      '/cart/items',
      { productVariantId, quantity }
    );
    return res.data.data;
  },

  updateItem: async (itemId: number, quantity: number) => {
    const res = await apiClient.put<ApiResponse<CartItem>>(
      `/cart/items/${itemId}`,
      { quantity }
    );
    return res.data.data;
  },

  deleteItem: async (productVariantId: number) => {
    await apiClient.delete('/cart/items', {
      params: { productVariantId },
    });
  },

  clearCart: async () => {
    await apiClient.delete('/cart/clear');
  },

  validateCart: async () => {
    const res = await apiClient.post<ApiResponse<{
      valid: boolean;
      itemCount: number;
      message: string;
    }>>('/cart/validate');

    return res.data.data;
  },
};

export default cartApi;
