
import apiClient from '../../config/axios';

export interface ApiResponse<T> {
  message: string;
  data: T;
}

export interface ProductImage {
  id?: number;
  imageUrl?: string;
  image_url?: string;
  url?: string;
  isPrimary?: boolean;
  displayOrder?: number;
}

export interface ProductVariant {
  id: number;
  sku?: string;
  size?: string;
  color?: string;
  price: number;
  stockQuantity: number;
  status?: string;
}

export interface ProductDetail {
  id: number;
  name: string;
  slug?: string;
  description?: string;
  basePrice: number;
  discountPrice: number | null;
  images: ProductImage[];
  variants: ProductVariant[];
  totalStock?: number;
}

const cartProductApi = {
  getProductById: async (productId: number): Promise<ProductDetail> => {
    const response = await apiClient.get<ApiResponse<ProductDetail>>(
      `/products/${productId}`
    );

    return response.data.data;
  },
};

export default cartProductApi;
