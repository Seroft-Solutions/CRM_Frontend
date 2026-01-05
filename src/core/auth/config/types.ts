/**
 * NextAuth Type Definitions
 * Extended types for NextAuth session and JWT
 */

import type { JWT } from 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    access_token?: string;
    refresh_token?: string;
    error?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    access_token?: string;
    refresh_token?: string;
    expires_at?: number;
    error?: string;
    shouldSignOut?: boolean;
    id_token?: string;
    refreshAttempts?: number;
    lastRefreshAt?: number;
  }
}

/**
 * Token refresh result
 */
export interface RefreshResult {
  token: JWT;
  success: boolean;
}

/**
 * Token validation result
 */
export interface TokenValidation {
  isValid: boolean;
  shouldRefresh: boolean;
  reason?: string;
}

/**
 * Refresh tracking entry
 */
export interface RefreshEntry {
  promise: Promise<JWT>;
  timestamp: number;
}
