import apiClient from '@/config/axios';
import { ApiResponse, PageResponse } from '../types';
import { BrandResponse, BrandRequest } from '../types';

const BASE_URL = '/admin/brands';

export const getBrands = async (page: number = 0, size: number = 10, search?: string, status?: string) => {
  const params = new URLSearchParams();
  params.append('page', page.toString());
  params.append('size', size.toString());
  if (search) params.append('search', search);
  if (status) params.append('status', status);

  const response = await apiClient.get<ApiResponse<PageResponse<BrandResponse>>>(`${BASE_URL}?${params.toString()}`);
  return response.data.data;
};

export const createBrand = async (data: BrandRequest) => {
  const response = await apiClient.post<ApiResponse<BrandResponse>>(BASE_URL, data);
  return response.data.data;
};

export const updateBrand = async (id: number, data: BrandRequest) => {
  const response = await apiClient.put<ApiResponse<BrandResponse>>(`${BASE_URL}/${id}`, data);
  return response.data.data;
};

export const deleteBrand = async (id: number) => {
  await apiClient.delete(`${BASE_URL}/${id}`);
};

export const updateBrandStatus = async (id: number, status: string) => {
  await apiClient.patch(`${BASE_URL}/${id}/status`, { status });
};


export const getAllBrands = async (): Promise<BrandResponse[]> => {
  const pageSize = 200;
  const all: BrandResponse[] = [];
  let page = 0;
  let totalPages = 1;
  while (page < totalPages) {
    const data = await getBrands(page, pageSize);
    all.push(...data.content);
    totalPages = data.totalPages;
    page += 1;
  }
  return all;
};
