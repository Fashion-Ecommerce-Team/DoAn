import apiClient from '@/config/axios';
import { ApiResponse, PageResponse } from '../types';
import { PaymentResponse } from '../types';

const BASE_URL = '/admin/payments';

export const getPayments = async (
  page: number = 0,
  size: number = 10,
  search?: string,
  status?: string,
  method?: string,
  orderId?: number
) => {
  const params = new URLSearchParams();
  params.append('page', page.toString());
  params.append('size', size.toString());
  if (search) params.append('search', search);
  if (status && status !== 'ALL') params.append('status', status);
  if (method && method !== 'ALL') params.append('method', method);
  if (orderId) params.append('orderId', orderId.toString());

  const response = await apiClient.get<ApiResponse<PageResponse<PaymentResponse>>>(`${BASE_URL}?${params.toString()}`);
  return response.data.data;
};

export const getPaymentById = async (id: number) => {
  const response = await apiClient.get<ApiResponse<PaymentResponse>>(`${BASE_URL}/${id}`);
  return response.data.data;
};

export const updatePaymentStatus = async (id: number, status: string) => {
  const response = await apiClient.patch<ApiResponse<PaymentResponse>>(`${BASE_URL}/${id}/status`, { status });
  return response.data.data;
};

