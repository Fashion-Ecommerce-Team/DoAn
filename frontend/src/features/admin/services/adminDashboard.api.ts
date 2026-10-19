import apiClient from '@/config/axios';
import { ApiResponse } from '../types';
import { DashboardStatsResponse, RecentOrder, RevenueData, TopSellingProduct } from '../types';
const BASE_URL = '/admin/dashboard';
export const getDashboardStats = async (): Promise<DashboardStatsResponse> => {
  const response = await apiClient.get<ApiResponse<DashboardStatsResponse>>(`${BASE_URL}/stats`);
  return response.data.data;
};

export const getRecentOrders = async (): Promise<RecentOrder[]> => {
  const response = await apiClient.get<ApiResponse<RecentOrder[]>>(`${BASE_URL}/recent-orders`);
  return response.data.data;
};
export const getRevenueChart = async (period: string = '7days'): Promise<RevenueData[]> => {
  const response = await apiClient.get<ApiResponse<RevenueData[]>>(`${BASE_URL}/revenue-chart?period=${period}`);
  return response.data.data;
};
export const getTopSellingProducts = async (): Promise<TopSellingProduct[]> => {
  const response = await apiClient.get<ApiResponse<TopSellingProduct[]>>(`${BASE_URL}/top-selling`);
  return response.data.data;
};

