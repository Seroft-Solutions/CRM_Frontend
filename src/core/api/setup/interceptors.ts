import { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { axiosInstance } from '../client/axios-client';
import { TokenService } from '@/core/auth/services/token.service';
import { refreshToken1 } from "@/core";
import { eventBus, EventNames } from '@/core/common/utils/eventBus';

/**
 * A flag to prevent multiple refresh token requests
 */
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: any) => void;
}> = [];

/**
 * Process the queue of failed requests
 */
const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(promise => {
    if (error) {
      promise.reject(error);
    } else if (token) {
      promise.resolve(token);
    }
  });

  failedQueue = [];
};

/**
 * Setup authentication interceptors for axios
 */
export const setupAuthInterceptors = (tokenService: TokenService) => {
  // Request interceptor to add auth token
  const requestInterceptor = axiosInstance.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
      // List of public endpoints that don't require authentication
      const publicEndpoints = ['/api/auth/register', '/api/auth/login', '/api/auth/refresh'];

      // Skip adding token for public endpoints
      const isPublicEndpoint = publicEndpoints.some(endpoint => config.url?.includes(endpoint));

      if (!isPublicEndpoint) {
        const token = tokenService.getToken();

        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
          // Log for debugging (remove in production)
          console.debug('Added auth token to request', { url: config.url });
        } else {
          console.debug('No auth token available for request', { url: config.url });
        }
      }

      return config;
    },
    error => Promise.reject(error)
  );

  // Response interceptor to handle token refresh
  const responseInterceptor = axiosInstance.interceptors.response.use(
    response => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as InternalAxiosRequestConfig & {
        _retry?: boolean;
      };

      // Log error details
      console.error(`API Error: ${error.response?.status} - ${error.message}`, {
        url: originalRequest.url,
        method: originalRequest.method,
      });
      
      // If error is 401 and we haven't retried the request yet
      if (
        error.response?.status === 401 &&
        !originalRequest._retry &&
        // Don't retry refresh token endpoint
        !originalRequest.url?.includes('refresh')
      ) {
        if (isRefreshing) {
          // If refreshing is in progress, queue this request
          try {
            const token = await new Promise<string>((resolve, reject) => {
              failedQueue.push({ resolve, reject });
            });

            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }

            return axiosInstance(originalRequest);
          } catch (err) {
            return Promise.reject(err);
          }
        }

        // Start refreshing
        originalRequest._retry = true;
        isRefreshing = true;

        try {
          // Get refresh token
          const refreshToken = await tokenService.getRefreshToken();

          if (!refreshToken) {
            // No refresh token, clear auth and reject
            await tokenService.clearTokens();
            processQueue(new Error('No refresh token available'));
            return Promise.reject(error);
          }

          // Call refresh token endpoint using the generated API function
          const response = await refreshToken1();

          // Check if we have valid response with tokens
          if (!response || !response.token || !response.refreshToken) {
            throw new Error('Invalid refresh token response');
          }

          const { token, refreshToken: newRefreshToken } = response;

          // Store new tokens
          tokenService.setToken(token);
          tokenService.setRefreshToken(newRefreshToken);
          
          // Log for debugging (remove in production)
          console.debug('Tokens refreshed successfully');

          // Update authorization header
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }

          // Process queued requests
          processQueue(null, token);

          // Retry original request
          return axiosInstance(originalRequest);
        } catch (refreshError) {
          // Refresh failed, clear auth and reject all queued requests
          await tokenService.clearTokens();
          processQueue(refreshError);
          
          // Emit unauthorized event
          eventBus.emit(EventNames.AUTH.UNAUTHORIZED);
          console.error('Token refresh failed - authentication required');
          
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }

      return Promise.reject(error);
    }
  );

  // Return a cleanup function
  return () => {
    axiosInstance.interceptors.request.eject(requestInterceptor);
    axiosInstance.interceptors.response.eject(responseInterceptor);
  };
};
