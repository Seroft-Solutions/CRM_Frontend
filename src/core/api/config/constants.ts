// Authentication token keys
export const AUTH_TOKEN_KEY = process.env.NEXT_PUBLIC_AUTH_TOKEN_KEY || 'auth_token';
export const AUTH_REFRESH_TOKEN_KEY =
  process.env.NEXT_PUBLIC_AUTH_REFRESH_TOKEN_KEY || 'refresh_token';

// API configuration
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// Request timeout in milliseconds
export const REQUEST_TIMEOUT = 30000;

// Default headers
export const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  Accept: 'application/json',
};
