/**
 * Token Validation Utilities
 * Functions to validate and check token state
 */

import type { JWT } from 'next-auth/jwt';
import type { TokenValidation } from './types';
import { MAX_REFRESH_ATTEMPTS, MAX_TOKEN_AGE_SECONDS, REFRESH_BUFFER_SECONDS } from './constants';

/**
 * Check if token is marked for signout
 */
export function isMarkedForSignout(token: JWT): boolean {
  if (token.shouldSignOut) {
    return true;
  }

  if (
    token.error === 'RefreshAccessTokenError' &&
    token.refreshAttempts &&
    token.refreshAttempts >= MAX_REFRESH_ATTEMPTS
  ) {
    return true;
  }

  return false;
}

/**
 * Check if token is too old to refresh
 */
export function isTokenTooOld(token: JWT): boolean {
  if (!token.expires_at) {
    return false;
  }

  const now = Date.now() / 1000;
  const tokenAge = now - token.expires_at;

  return tokenAge > MAX_TOKEN_AGE_SECONDS;
}

/**
 * Check if token needs refresh
 */
export function shouldRefreshToken(token: JWT): boolean {
  if (!token.expires_at) {
    return false;
  }

  if (token.shouldSignOut || token.error) {
    return false;
  }

  const now = Date.now() / 1000;

  return now >= token.expires_at - REFRESH_BUFFER_SECONDS;
}

/**
 * Validate token state comprehensively
 */
export function validateToken(token: JWT): TokenValidation {
  // Check if marked for signout
  if (isMarkedForSignout(token)) {
    return {
      isValid: false,
      shouldRefresh: false,
      reason: 'Token marked for signout',
    };
  }

  // Check if too old
  if (isTokenTooOld(token)) {
    return {
      isValid: false,
      shouldRefresh: false,
      reason: 'Token too old to refresh',
    };
  }

  // Check if missing refresh token
  if (!token.refresh_token) {
    return {
      isValid: false,
      shouldRefresh: false,
      reason: 'No refresh token available',
    };
  }

  // Check if needs refresh
  if (shouldRefreshToken(token)) {
    return {
      isValid: true,
      shouldRefresh: true,
      reason: 'Token expires soon',
    };
  }

  // Token is valid and doesn't need refresh yet
  return {
    isValid: true,
    shouldRefresh: false,
  };
}

/**
 * Get user ID from token
 */
export function getUserId(token: JWT): string | null {
  return (token.sub as string) || null;
}

/**
 * Calculate time until token expires
 */
export function getTimeUntilExpiry(token: JWT): number {
  if (!token.expires_at) {
    return 0;
  }

  const now = Date.now() / 1000;

  return Math.max(0, token.expires_at - now);
}

/**
 * Get human-readable token age
 */
export function getTokenAge(token: JWT): string {
  if (!token.expires_at) {
    return 'unknown';
  }

  const now = Date.now() / 1000;
  const ageSeconds = now - token.expires_at;

  if (ageSeconds < 0) {
    return `expires in ${Math.floor(-ageSeconds / 60)} minutes`;
  }

  const hours = Math.floor(ageSeconds / 3600);

  if (hours > 0) {
    return `expired ${hours} hours ago`;
  }

  const minutes = Math.floor(ageSeconds / 60);

  return `expired ${minutes} minutes ago`;
}
