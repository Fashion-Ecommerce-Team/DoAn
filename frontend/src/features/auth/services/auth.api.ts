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

export interface OtpResponse {
  email: string;
  expiresInSeconds: number;
  mailSent: boolean;
  devOtp?: string | null;
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

  sendRegisterOtp: async (request: RegisterRequest): Promise<{ message: string; data: OtpResponse }> => {
    const res = await apiClient.post<{ message: string; data: OtpResponse }>('/auth/register/send-otp', request);
    return { message: res.data.message, data: res.data.data };
  },

  verifyRegisterOtp: async (email: string, otp: string): Promise<string> => {
    const res = await apiClient.post<{ message: string }>('/auth/register/verify-otp', { email, otp });
    return res.data.message || 'Xác thực OTP và đăng ký thành công!';
  },

  forgotPassword: async (email: string): Promise<{ message: string; data: OtpResponse }> => {
    const res = await apiClient.post<{ message: string; data: OtpResponse }>('/auth/forgot-password', { email });
    return { message: res.data.message, data: res.data.data };
  },

  resetPassword: async (payload: { email: string; otp: string; newPassword: string }): Promise<string> => {
    const res = await apiClient.post<{ message: string }>('/auth/reset-password', payload);
    return res.data.message || 'Đặt lại mật khẩu thành công!';
  },
};
