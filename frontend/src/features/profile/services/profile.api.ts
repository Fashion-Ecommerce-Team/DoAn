import apiClient from '@/config/axios';

export interface UserProfile {
  id: number;
  email: string;
  fullName: string;
  phone?: string;
  avatarUrl?: string;
  role?: string;
  status?: string;
  authProvider?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UpdateProfileRequest {
  fullName: string;
  phone?: string;
  avatarUrl?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export const profileApi = {
  getProfile: async (): Promise<UserProfile> => {
    const res = await apiClient.get<{ message: string; data: UserProfile }>('/profile');
    return res.data.data;
  },

  updateProfile: async (data: UpdateProfileRequest): Promise<UserProfile> => {
    const res = await apiClient.put<{ message: string; data: UserProfile }>('/profile', data);
    return res.data.data;
  },

  changePassword: async (data: ChangePasswordRequest): Promise<string> => {
    const res = await apiClient.put<{ message: string; data?: unknown }>('/profile/change-password', data);
    return res.data.message || 'Đổi mật khẩu thành công!';
  },
};

