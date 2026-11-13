import apiClient from '@/config/axios';
import { AuthUser } from '../authSlice';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  phone: string;
}

export interface AuthResponse {
  accessToken: string;
  tokenType: string;
  userId: number;
  email: string;
  fullName: string;
  role: string;
}

export const authApi = {
  login: async (request: LoginRequest): Promise<{ token: string; user: AuthUser }> => {
    const res = await apiClient.post<{ message: string; data: AuthResponse }>('/auth/login', request);
    const data = res.data.data;
    return {
      token: data.accessToken,
      user: {
        id: data.userId,
        userId: data.userId,
        email: data.email,
        fullName: data.fullName,
        role: data.role,
      },
    };
  },

  register: async (request: RegisterRequest): Promise<string> => {
    const res = await apiClient.post<{ message: string; data?: unknown }>('/auth/register', request);
    return res.data.message || 'Đăng ký tài khoản thành công!';
  },
};

