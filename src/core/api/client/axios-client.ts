import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { API_URL, DEFAULT_HEADERS, REQUEST_TIMEOUT } from '../config/constants';

// Create a base axios instance with default configuration
export const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: REQUEST_TIMEOUT,
  headers: DEFAULT_HEADERS,
});

// Generic request function for type safety
export const axiosClient = {
  get: <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    return axiosInstance.get<T, AxiosResponse<T>>(url, config).then(response => response.data);
  },

  post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    return axiosInstance
      .post<T, AxiosResponse<T>>(url, data, config)
      .then(response => response.data);
  },

  put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    return axiosInstance
      .put<T, AxiosResponse<T>>(url, data, config)
      .then(response => response.data);
  },

  patch: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    return axiosInstance
      .patch<T, AxiosResponse<T>>(url, data, config)
      .then(response => response.data);
  },

  delete: <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    return axiosInstance.delete<T, AxiosResponse<T>>(url, config).then(response => response.data);
  },
};
