import apiClient from '@/config/axios';
import { ApiResponse, PageResponse } from '../types';
import { OrderResponse, OrderStatusHistoryItem } from '../types';

const BASE_URL = '/admin/orders';

export const getOrders = async (page: number = 0, size: number = 10, search?: string, status?: string, userId?: number) => {
  const params = new URLSearchParams();
  params.append('page', page.toString());
  params.append('size', size.toString());
  if (search) params.append('search', search);
  if (status && status !== 'ALL') params.append('status', status);
  if (userId) params.append('userId', userId.toString());

  const response = await apiClient.get<ApiResponse<PageResponse<OrderResponse>>>(`${BASE_URL}?${params.toString()}`);
  return response.data.data;
};

export const getOrderById = async (id: number) => {
  const response = await apiClient.get<ApiResponse<OrderResponse>>(`${BASE_URL}/${id}`);
  return response.data.data;
};

export const getOrderHistory = async (id: number) => {
  const response = await apiClient.get<ApiResponse<OrderStatusHistoryItem[]>>(`${BASE_URL}/${id}/history`);
  return response.data.data;
};

export const updateOrderStatus = async (id: number, status: string, note?: string) => {
  const response = await apiClient.put<ApiResponse<OrderResponse>>(`${BASE_URL}/${id}/status`, { status, note });
  return response.data.data;
};

export const cancelOrder = async (id: number, reason?: string) => {
  const response = await apiClient.put<ApiResponse<void>>(`${BASE_URL}/${id}/cancel`, reason ? { reason } : undefined);
  return response.data;
};


