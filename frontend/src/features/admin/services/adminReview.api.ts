import apiClient from '@/config/axios';
import { ReviewResponse, ApiResponse, PageResponse } from '../types';

const BASE_URL = '/admin/reviews';

export const getReviews = async (page: number = 0, size: number = 10, search?: string, status?: string, productId?: number) => {
  const params = new URLSearchParams({
    page: page.toString(),
    size: size.toString(),
  });
  if (search) params.append('search', search);
  if (status && status !== 'ALL') params.append('status', status);
  if (productId) params.append('productId', productId.toString());

  const response = await apiClient.get<ApiResponse<PageResponse<ReviewResponse>>>(`${BASE_URL}?${params.toString()}`);
  return response.data.data;
};

export const getReviewById = async (id: number) => {
  const response = await apiClient.get<ApiResponse<ReviewResponse>>(`${BASE_URL}/${id}`);
  return response.data.data;
};

export const updateReviewStatus = async (id: number, status: string) => {
  const response = await apiClient.put<ApiResponse<void>>(`${BASE_URL}/${id}/status`, { status });
  return response.data;
};

export const deleteReview = async (id: number) => {
  const response = await apiClient.delete<ApiResponse<void>>(`${BASE_URL}/${id}`);
  return response.data.data;
};

