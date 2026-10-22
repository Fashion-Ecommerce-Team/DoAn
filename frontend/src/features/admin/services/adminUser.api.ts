import apiClient from '@/config/axios';
import { ApiResponse, PageResponse } from '../types';
import { UserResponse, UserAddressResponse } from '../types';

const BASE_URL = '/admin/users';

export const getUsers = async (page: number = 0, size: number = 10, search?: string, status?: string, roleId?: number) => {
  const params = new URLSearchParams();
  params.append('page', page.toString());
  params.append('size', size.toString());
  if (search) params.append('search', search);
  if (status && status !== 'ALL') params.append('status', status);
  if (roleId && roleId > 0) params.append('roleId', roleId.toString());

  const response = await apiClient.get<ApiResponse<PageResponse<UserResponse>>>(`${BASE_URL}?${params.toString()}`);
  return response.data.data;
};

export const updateUserStatus = async (id: number, status: string) => {
  const response = await apiClient.patch<ApiResponse<void>>(`${BASE_URL}/${id}/status`, { status });
  return response.data;
};

export const updateUserRole = async (id: number, roleId: number) => {
  const response = await apiClient.put<ApiResponse<void>>(`${BASE_URL}/${id}/role`, { roleId });
  return response.data;
};

export const deleteUser = async (id: number) => {
  await apiClient.delete(`${BASE_URL}/${id}`);
};

export const getUserById = async (id: number) => {
  const response = await apiClient.get<ApiResponse<UserResponse>>(`${BASE_URL}/${id}`);
  return response.data.data;
};

export const getUserAddresses = async (id: number) => {
  const response = await apiClient.get<ApiResponse<UserAddressResponse[]>>(`${BASE_URL}/${id}/addresses`);
  return response.data.data;
};


