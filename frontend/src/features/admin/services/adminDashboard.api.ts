import apiClient from '@/config/axios';
import { ApiResponse } from '../types';
import {
  DashboardStatsResponse,
  RecentOrder,
  RevenueData,
  TopSellingProduct,
  UserGrowthData,
  OrderGrowthData,
  BrandRevenueData,
  CategoryRevenueData,
  TopCouponData,
  CustomerRetentionData,
  PaymentRevenueData,
  CancellationStatsData,
} from '../types';

const BASE_URL = '/admin/dashboard';

export const getDashboardStats = async (): Promise<DashboardStatsResponse> => {
  const response = await apiClient.get<ApiResponse<DashboardStatsResponse>>(`${BASE_URL}/stats`);
  return response.data.data;
};

export const getRecentOrders = async (): Promise<RecentOrder[]> => {
  const response = await apiClient.get<ApiResponse<RecentOrder[]>>(`${BASE_URL}/recent-orders`);
  return response.data.data;
};

export const getRevenueChart = async (period: string = '1year'): Promise<RevenueData[]> => {
  const response = await apiClient.get<ApiResponse<RevenueData[]>>(`${BASE_URL}/revenue-chart?period=${period}`);
  return response.data.data;
};

export const getTopSellingProducts = async (): Promise<TopSellingProduct[]> => {
  const response = await apiClient.get<ApiResponse<TopSellingProduct[]>>(`${BASE_URL}/top-selling`);
  return response.data.data;
};

export const getUserGrowthChart = async (): Promise<UserGrowthData[]> => {
  const response = await apiClient.get<ApiResponse<UserGrowthData[]>>(`${BASE_URL}/user-growth`);
  return response.data.data;
};

export const getOrderGrowthChart = async (): Promise<OrderGrowthData[]> => {
  const response = await apiClient.get<ApiResponse<OrderGrowthData[]>>(`${BASE_URL}/order-growth`);
  return response.data.data;
};

export const getBrandRevenue = async (): Promise<BrandRevenueData[]> => {
  const response = await apiClient.get<ApiResponse<BrandRevenueData[]>>(`${BASE_URL}/brand-revenue`);
  return response.data.data;
};

export const getCategoryRevenue = async (): Promise<CategoryRevenueData[]> => {
  const response = await apiClient.get<ApiResponse<CategoryRevenueData[]>>(`${BASE_URL}/category-revenue`);
  return response.data.data;
};

export const getTopCoupons = async (): Promise<TopCouponData[]> => {
  const response = await apiClient.get<ApiResponse<TopCouponData[]>>(`${BASE_URL}/top-coupons`);
  return response.data.data;
};

export const getCustomerRetention = async (): Promise<CustomerRetentionData> => {
  const response = await apiClient.get<ApiResponse<CustomerRetentionData>>(`${BASE_URL}/customer-retention`);
  return response.data.data;
};

export const getPaymentMethodRevenue = async (): Promise<PaymentRevenueData[]> => {
  const response = await apiClient.get<ApiResponse<PaymentRevenueData[]>>(`${BASE_URL}/payment-revenue`);
  return response.data.data;
};

export const getCancellationStats = async (): Promise<CancellationStatsData> => {
  const response = await apiClient.get<ApiResponse<CancellationStatsData>>(`${BASE_URL}/cancellation-rate`);
  return response.data.data;
};
