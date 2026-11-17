
import axios from 'axios';

const apiClient = axios.create({
  baseURL:
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:8080/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// ==========================================
// REQUEST INTERCEPTOR
// Tự động đính kèm JWT Bearer Token
// ==========================================

apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ==========================================
// RESPONSE INTERCEPTOR
// Xử lý JWT hết hạn hoặc không hợp lệ
// ==========================================

apiClient.interceptors.response.use(
  (response) => response,

  (error) => {
    if (
      error.response?.status === 401 &&
      typeof window !== 'undefined'
    ) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }

    return Promise.reject(error);
  }
);

export default apiClient;
