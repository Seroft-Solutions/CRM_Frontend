import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { API_URL, DEFAULT_HEADERS, REQUEST_TIMEOUT } from '../config/constants';

// Create axios instance
export const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: REQUEST_TIMEOUT,
  headers: DEFAULT_HEADERS,
});

// Generic request function with proper TypeScript types
interface RequestData {
  [key: string]: unknown;
}

export const axiosClient = {
  get: <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    return axiosInstance.get<T, AxiosResponse<T>>(url, config).then(response => response.data);
  },

  post: <T>(url: string, data?: RequestData, config?: AxiosRequestConfig): Promise<T> => {
    return axiosInstance
      .post<T, AxiosResponse<T>>(url, data, config)
      .then(response => response.data);
  },

  put: <T>(url: string, data?: RequestData, config?: AxiosRequestConfig): Promise<T> => {
    return axiosInstance
      .put<T, AxiosResponse<T>>(url, data, config)
      .then(response => response.data);
  },

  patch: <T>(url: string, data?: RequestData, config?: AxiosRequestConfig): Promise<T> => {
    return axiosInstance
      .patch<T, AxiosResponse<T>>(url, data, config)
      .then(response => response.data);
  },

  delete: <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    return axiosInstance.delete<T, AxiosResponse<T>>(url, config).then(response => response.data);
  },
};
