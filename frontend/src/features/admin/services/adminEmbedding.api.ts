import apiClient from '@/config/axios';
import { ApiResponse, PageResponse } from '../types';
import {
  EmbeddingLogResponse,
  EmbeddingStatus,
  QdrantInfo,
  JobProgressResponse,
  BatchSyncRequest,
  RetryFailedResult,
  MissingEmbeddingProduct,
} from '../types';

const BASE_URL = '/admin/embeddings';

export const getEmbeddings = async (page: number = 0, size: number = 10, status?: string, productId?: number) => {
  const params = new URLSearchParams();
  params.append('page', page.toString());
  params.append('size', size.toString());
  if (status) params.append('status', status);
  if (productId) params.append('productId', productId.toString());

  const response = await apiClient.get<ApiResponse<PageResponse<EmbeddingLogResponse>>>(`${BASE_URL}?${params.toString()}`);
  return response.data.data;
};

export const getEmbeddingStatus = async () => {
  const response = await apiClient.get<ApiResponse<EmbeddingStatus>>(`${BASE_URL}/status`);
  return response.data.data;
};

export const getQdrantInfo = async () => {
  const response = await apiClient.get<ApiResponse<QdrantInfo>>(`${BASE_URL}/qdrant/info`);
  return response.data.data;
};

export const syncProductEmbedding = async (productId: number) => {
  const response = await apiClient.post<ApiResponse<Record<string, unknown>>>(`${BASE_URL}/${productId}/sync`);
  return response.data.data;
};

export const deleteProductEmbedding = async (productId: number) => {
  await apiClient.delete(`${BASE_URL}/${productId}`);
};

export const startBatchSync = async (data?: BatchSyncRequest) => {
  const response = await apiClient.post<ApiResponse<JobProgressResponse>>(`${BASE_URL}/sync-batch`, data ?? {});
  return response.data.data;
};

export const getEmbeddingJob = async (jobId: string) => {
  const response = await apiClient.get<ApiResponse<JobProgressResponse>>(`${BASE_URL}/jobs/${jobId}`);
  return response.data.data;
};

export const cancelEmbeddingJob = async (jobId: string) => {
  const response = await apiClient.post<ApiResponse<JobProgressResponse>>(`${BASE_URL}/jobs/${jobId}/cancel`);
  return response.data.data;
};

export const startReconcile = async () => {
  const response = await apiClient.post<ApiResponse<JobProgressResponse>>(`${BASE_URL}/reconcile`);
  return response.data.data;
};

export const retryFailedEmbeddings = async () => {
  const response = await apiClient.post<ApiResponse<RetryFailedResult>>(`${BASE_URL}/retry-failed`);
  return response.data.data;
};

export const getMissingEmbeddingProducts = async (page: number = 0, size: number = 10, keyword?: string) => {
  const params = new URLSearchParams();
  params.append('page', page.toString());
  params.append('size', size.toString());
  if (keyword) params.append('keyword', keyword);
  const response = await apiClient.get<ApiResponse<PageResponse<MissingEmbeddingProduct>>>(`${BASE_URL}/missing?${params.toString()}`);
  return response.data.data;
};
