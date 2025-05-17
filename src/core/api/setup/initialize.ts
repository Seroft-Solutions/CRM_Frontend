/**
 * API initialization
 *
 * This file contains functions to initialize the API client with authentication.
 */
import { axiosInstance } from '../client/axios-client';
import { setupAuthInterceptors } from './interceptors';
import { createTokenService } from '@/core/auth/services/token.service';
import {AUTH_TOKEN_KEY, AUTH_REFRESH_TOKEN_KEY, API_URL} from '../config/constants';

let cleanup: (() => void) | null = null;

/**
 * Initialize the API client with authentication interceptors
 */
export function initializeApi(): void {
  // Create token service with the configured keys
  const tokenService = createTokenService({
    tokenKey: AUTH_TOKEN_KEY,
    refreshTokenKey: AUTH_REFRESH_TOKEN_KEY,
  });

  // Check for existing tokens
  const token = tokenService.getToken();
  const refreshToken = tokenService.getRefreshToken();
  
  // Log initialization status
  console.debug('API client initializing', { 
    baseURL: API_URL,
    hasToken: !!token, 
    hasRefreshToken: !!refreshToken
  });

  // Setup authentication interceptors
  cleanup = setupAuthInterceptors(tokenService);

  console.log('API client initialized with authentication interceptors');
}

/**
 * Clean up API client resources
 */
export function cleanupApi(): void {
  if (cleanup) {
    cleanup();
    cleanup = null;
    console.log('API client cleanup completed');
  }
}
