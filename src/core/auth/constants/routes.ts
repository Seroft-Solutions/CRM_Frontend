/**
 * Authentication API routes constants
 *
 * This file contains all authentication-related API route paths
 * to ensure consistency across the application.
 */

export const AUTH_ROUTES = {
  // Auth endpoints
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  LOGOUT: '/auth/logout',
  REFRESH_TOKEN: '/auth/token/refresh',
  VERIFY_EMAIL: '/auth/verify-email',
  REQUEST_PASSWORD_RESET: '/auth/forgot-password',
  RESET_PASSWORD: '/auth/reset-password',

  // User profile endpoints
  PROFILE: '/auth/me',
  PROFILE_BY_ID: (id: string | number) => `/v1/users/profile/${id}`,

  // Social auth endpoints
  SOCIAL_CALLBACK: '/auth/social/callback',

  // Health check
  HEALTH: '/auth/health',
};

/**
 * Helper function to get the full API path with base URL
 */
export function getAuthApiUrl(route: keyof typeof AUTH_ROUTES): string {
  return `${AUTH_ROUTES[route]}`;
}

export default AUTH_ROUTES;
