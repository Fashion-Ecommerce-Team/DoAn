import apiClient from '@/config/axios';
import { CouponResponse, CouponRequest, ApiResponse, PageResponse } from '../types';

const BASE_URL = '/admin/coupons';

export const getCoupons = async (page: number = 0, size: number = 10, search?: string, status?: string) => {
  const params = new URLSearchParams({
    page: page.toString(),
    size: size.toString(),
  });
  if (search) params.append('search', search);
  if (status && status !== 'ALL') params.append('status', status);

  const response = await apiClient.get<ApiResponse<PageResponse<CouponResponse>>>(`${BASE_URL}?${params.toString()}`);
  return response.data.data;
};

export const getCouponById = async (id: number) => {
  const response = await apiClient.get<ApiResponse<CouponResponse>>(`${BASE_URL}/${id}`);
  return response.data.data;
};

export const createCoupon = async (data: CouponRequest) => {
  const response = await apiClient.post<ApiResponse<CouponResponse>>(`${BASE_URL}`, data);
  return response.data.data;
};

export const updateCoupon = async (id: number, data: CouponRequest) => {
  const response = await apiClient.put<ApiResponse<CouponResponse>>(`${BASE_URL}/${id}`, data);
  return response.data.data;
};

export const updateCouponStatus = async (id: number, status: string) => {
  const response = await apiClient.put<ApiResponse<void>>(`${BASE_URL}/${id}/status`, { status });
  return response.data;
};

export const deleteCoupon = async (id: number) => {
  const response = await apiClient.delete<ApiResponse<void>>(`${BASE_URL}/${id}`);
  return response.data.data;
};

