import apiClient from '@/config/axios';
import { ApiResponse, PageResponse, PolicyDocumentRequest, PolicyDocumentResponse } from '../types';

const BASE_URL = '/admin/policies';

export const getPolicies = async (
  page: number = 0,
  size: number = 10,
  search?: string,
  category?: string,
  status?: string
): Promise<PageResponse<PolicyDocumentResponse>> => {
  const params = new URLSearchParams();
  params.append('page', page.toString());
  params.append('size', size.toString());
  if (search) params.append('search', search);
  if (category && category !== 'ALL') params.append('category', category);
  if (status && status !== 'ALL') params.append('status', status);

  const response = await apiClient.get<ApiResponse<PageResponse<PolicyDocumentResponse>>>(
    `${BASE_URL}?${params.toString()}`
  );
  return response.data.data;
};

export const getPolicyById = async (id: number): Promise<PolicyDocumentResponse> => {
  const response = await apiClient.get<ApiResponse<PolicyDocumentResponse>>(`${BASE_URL}/${id}`);
  return response.data.data;
};

export const createPolicy = async (
  data: PolicyDocumentRequest,
  file?: File | null
): Promise<PolicyDocumentResponse> => {
  const formData = new FormData();
  formData.append(
    'data',
    new Blob([JSON.stringify(data)], { type: 'application/json' })
  );
  if (file) {
    formData.append('file', file);
  }

  const response = await apiClient.post<ApiResponse<PolicyDocumentResponse>>(BASE_URL, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data.data;
};

export const updatePolicy = async (
  id: number,
  data: PolicyDocumentRequest,
  file?: File | null
): Promise<PolicyDocumentResponse> => {
  const formData = new FormData();
  formData.append(
    'data',
    new Blob([JSON.stringify(data)], { type: 'application/json' })
  );
  if (file) {
    formData.append('file', file);
  }

  const response = await apiClient.put<ApiResponse<PolicyDocumentResponse>>(`${BASE_URL}/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data.data;
};

export const deletePolicy = async (id: number): Promise<void> => {
  await apiClient.delete(`${BASE_URL}/${id}`);
};

export const updatePolicyStatus = async (id: number, isActive: boolean): Promise<void> => {
  await apiClient.patch(`${BASE_URL}/${id}/status`, { isActive });
};

/** Đồng bộ vector BKAI (768d) cho chính sách lên Qdrant */
export const syncPolicyEmbedding = async (id: number): Promise<PolicyDocumentResponse> => {
  const response = await apiClient.post<ApiResponse<PolicyDocumentResponse>>(`${BASE_URL}/${id}/sync`);
  return response.data.data;
};

/** Xóa vector embedding của chính sách khỏi Qdrant */
export const deletePolicyEmbedding = async (id: number): Promise<PolicyDocumentResponse> => {
  const response = await apiClient.delete<ApiResponse<PolicyDocumentResponse>>(`${BASE_URL}/${id}/embedding`);
  return response.data.data;
};

/** Lấy thông tin Qdrant Collection của Policy */
export const getPolicyQdrantInfo = async (): Promise<any> => {
  const response = await apiClient.get<ApiResponse<any>>(`${BASE_URL}/qdrant/info`);
  return response.data.data;
};

/** Xóa toàn bộ dữ liệu vector Qdrant của Policy và tái tạo collection */
export const clearPolicyQdrant = async (): Promise<any> => {
  const response = await apiClient.delete<ApiResponse<any>>(`${BASE_URL}/qdrant/clear`);
  return response.data.data;
};

/** Đồng bộ tất cả các chính sách đang ACTIVE lên Qdrant bằng BKAI */
export const syncAllPolicies = async (): Promise<any> => {
  const response = await apiClient.post<ApiResponse<any>>(`${BASE_URL}/sync-all`);
  return response.data.data;
};
