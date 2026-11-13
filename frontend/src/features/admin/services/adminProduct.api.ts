import apiClient from '@/config/axios';
import { ApiResponse, PageResponse } from '../types';
import { ProductResponse, ProductRequest, ProductImageResponse } from '../types';

const BASE_URL = '/admin/products';

export const getProducts = async (
  page: number = 0,
  size: number = 10,
  search?: string,
  categoryId?: string,
  gender?: string,
  status?: string,
  minPrice?: number,
  maxPrice?: number
) => {
  const params = new URLSearchParams();
  params.append('page', page.toString());
  params.append('size', size.toString());
  if (search) params.append('keyword', search);
  if (categoryId && categoryId !== 'all') params.append('categoryId', categoryId);
  if (gender && gender !== 'ALL') params.append('gender', gender);
  if (status && status !== 'ALL') params.append('status', status);
  if (minPrice !== undefined && minPrice !== null && !isNaN(minPrice)) params.append('minPrice', minPrice.toString());
  if (maxPrice !== undefined && maxPrice !== null && !isNaN(maxPrice)) params.append('maxPrice', maxPrice.toString());

  const response = await apiClient.get<ApiResponse<PageResponse<ProductResponse>>>(`${BASE_URL}?${params.toString()}`);
  return response.data.data;
};

export const getProductById = async (id: number) => {
  const response = await apiClient.get<ApiResponse<ProductResponse>>(`${BASE_URL}/${id}`);
  const product = response.data.data;
  // Backend trả về field `url`, frontend dùng `imageUrl` -> chuẩn hóa tại đây
  if (product?.images) {
    product.images = product.images.map((img) => {
      const raw = img as ProductImageResponse & { url?: string };
      return { ...raw, imageUrl: raw.imageUrl || raw.url || '' };
    });
  }
  return product;
};

export const createProduct = async (data: ProductRequest) => {
  const response = await apiClient.post<ApiResponse<ProductResponse>>(BASE_URL, data);
  return response.data.data;
};

export const updateProduct = async (id: number, data: ProductRequest) => {
  const response = await apiClient.put<ApiResponse<ProductResponse>>(`${BASE_URL}/${id}`, data);
  return response.data.data;
};

export const deleteProduct = async (id: number) => {
  await apiClient.delete(`${BASE_URL}/${id}`);
};

export const toggleProductStatus = async (id: number) => {
  const response = await apiClient.patch<ApiResponse<null>>(`${BASE_URL}/${id}/toggle-status`);
  return response.data;
};

// Variants
export const addVariant = async (productId: number, data: unknown) => {
  const response = await apiClient.post<ApiResponse<unknown>>(`${BASE_URL}/${productId}/variants`, data);
  return response.data.data;
};

export const updateVariant = async (variantId: number, data: unknown
) => {
  const response = await apiClient.put<ApiResponse<unknown
>>(`${BASE_URL}/variants/${variantId}`, data);
  return response.data.data;
};

export const deleteVariant = async (variantId: number) => {
  await apiClient.delete(`${BASE_URL}/variants/${variantId}`);
};

export const toggleVariantStatus = async (variantId: number) => {
  await apiClient.patch(`${BASE_URL}/variants/${variantId}/status`);
};

// Images
export const addProductImage = async (productId: number, data: { imageUrl: string; cloudinaryPublicId: string; displayOrder?: number }) => {
  const response = await apiClient.post<ApiResponse<ProductImageResponse>>(`${BASE_URL}/${productId}/images`, data);
  return response.data.data;
};

export const deleteProductImage = async (imageId: number) => {
  await apiClient.delete(`${BASE_URL}/images/${imageId}`);
};

export const setPrimaryProductImage = async (imageId: number) => {
  await apiClient.patch(`${BASE_URL}/images/${imageId}/primary`);
};


