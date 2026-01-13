import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { supabase } from './supabase';

// Get API base URL from environment or use default
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Create axios instance
const apiInstance: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiInstance.interceptors.request.use(
  async (config) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiInstance.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Try to refresh the token
      const { data: { session }, error: refreshError } = await supabase.auth.refreshSession();

      if (refreshError || !session) {
        // Redirect to login if refresh fails
        window.location.href = '/login';
      } else if (error.config) {
        // Retry the request with new token
        error.config.headers.Authorization = `Bearer ${session.access_token}`;
        return apiInstance(error.config);
      }
    }
    return Promise.reject(error);
  }
);

// API wrapper with typed methods - returns response with data property typed as any for flexibility
export const api = {
  get: async (url: string, config?: AxiosRequestConfig): Promise<{ data: any }> => {
    const response = await apiInstance.get(url, config);
    return response;
  },

  post: async (url: string, data?: unknown, config?: AxiosRequestConfig): Promise<{ data: any }> => {
    const response = await apiInstance.post(url, data, config);
    return response;
  },

  put: async (url: string, data?: unknown, config?: AxiosRequestConfig): Promise<{ data: any }> => {
    const response = await apiInstance.put(url, data, config);
    return response;
  },

  patch: async (url: string, data?: unknown, config?: AxiosRequestConfig): Promise<{ data: any }> => {
    const response = await apiInstance.patch(url, data, config);
    return response;
  },

  delete: async (url: string, config?: AxiosRequestConfig): Promise<{ data: any }> => {
    const response = await apiInstance.delete(url, config);
    return response;
  },
};

// Export types for use in other modules
export type { AxiosError, AxiosResponse };
export default api;
