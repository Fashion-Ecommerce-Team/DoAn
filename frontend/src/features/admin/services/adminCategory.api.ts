import apiClient from '@/config/axios';
import { ApiResponse, PageResponse } from '../types';
import { CategoryResponse, CategoryRequest } from '../types';

const BASE_URL = '/admin/categories';

export const getCategories = async (page: number = 0, size: number = 10, search?: string, status?: string) => {
  const params = new URLSearchParams();
  params.append('page', page.toString());
  params.append('size', size.toString());
  if (search) params.append('search', search);
  if (status) params.append('status', status);

  const response = await apiClient.get<ApiResponse<PageResponse<CategoryResponse>>>(`${BASE_URL}?${params.toString()}`);
  return response.data.data;
};

export const createCategory = async (data: CategoryRequest) => {
  const response = await apiClient.post<ApiResponse<CategoryResponse>>(BASE_URL, data);
  return response.data.data;
};

export const updateCategory = async (id: number, data: CategoryRequest) => {
  const response = await apiClient.put<ApiResponse<CategoryResponse>>(`${BASE_URL}/${id}`, data);
  return response.data.data;
};

export const deleteCategory = async (id: number) => {
  await apiClient.delete(`${BASE_URL}/${id}`);
};

export const updateCategoryStatus = async (id: number, status: string) => {
  await apiClient.patch(`${BASE_URL}/${id}/status`, { status });
};

