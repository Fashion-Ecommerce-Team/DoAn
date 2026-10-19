import apiClient from '@/config/axios';
import { ApiResponse } from '../types';

export interface UploadResponse {
  url: string;
  publicId: string;
}

const BASE_URL = '/admin/upload';
export const uploadImage = async (file: File): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await apiClient.post<ApiResponse<UploadResponse>>(`${BASE_URL}/image`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  return response.data.data;
};

export const deleteImage = async (publicId: string): Promise<void> => {
  await apiClient.delete(`${BASE_URL}/image?publicId=${publicId}`);
};

