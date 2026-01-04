/**
 * Token Refresh Logic
 * Core functionality for refreshing access tokens with proper error handling
 *
 * @module core/auth/config/token-refresh
 */

import type { JWT } from 'next-auth/jwt';
import {
  refreshTokenWithKeycloak,
  isTokenExpiredError,
  isTemporaryError,
} from './keycloak-service';
import { refreshTracker } from './refresh-tracker';
import { isMarkedForSignout, isTokenTooOld, getUserId, getTokenAge } from './token-validation';
import { MAX_REFRESH_ATTEMPTS, DEFAULT_TOKEN_EXPIRY } from './constants';

/**
 * Create a failed token with error state
 * If shouldSignOut is true, caller should return null to clear session
 */
function createFailedToken(token: JWT, shouldSignOut: boolean, refreshAttempts: number): JWT {
  return {
    ...token,
    error: 'RefreshAccessTokenError',
    shouldSignOut,
    refreshAttempts,
  };
}

/**
 * Create a successful token with new credentials
 */
function createSuccessfulToken(
  token: JWT,
  data: {
    access_token: string;
    refresh_token?: string;
    id_token?: string;
    expires_in: number;
  }
): JWT {
  return {
    ...token,
    access_token: data.access_token,
    refresh_token: data.refresh_token ?? token.refresh_token,
    id_token: data.id_token ?? token.id_token,
    expires_at: Math.floor(Date.now() / 1000) + (data.expires_in || DEFAULT_TOKEN_EXPIRY),
    error: undefined,
    shouldSignOut: undefined,
    refreshAttempts: 0,
    lastRefreshAt: Math.floor(Date.now() / 1000),
  };
}

/**
 * Refresh access token
 * Returns null for permanent failures (forces session clear)
 * Returns JWT with error for temporary failures (allows retry)
 */
export async function refreshAccessToken(token: JWT): Promise<JWT | null> {
  // Early exit: Token already marked for signout
  if (isMarkedForSignout(token)) {
    console.error('[Refresh] Token marked for signout - cannot refresh');

    return null;
  }

  // Get user ID
  const userId = getUserId(token);

  if (!userId) {
    console.error('[Refresh] No user ID in token');

    return null;
  }

  // Check for concurrent refresh
  if (refreshTracker.isRefreshInProgress(userId)) {
    console.log(`[Refresh] Waiting for existing refresh operation (user: ${userId})`);
    const existingPromise = refreshTracker.getRefreshPromise(userId);

    return existingPromise || token;
  }

  // Check if token is too old
  if (isTokenTooOld(token)) {
    const age = getTokenAge(token);

    console.error(`[Refresh] Token too old to refresh: ${age}`);
    refreshTracker.clearRefresh(userId);

    return null;
  }

  // Check for refresh token
  if (!token.refresh_token) {
    console.error('[Refresh] No refresh token available');
    refreshTracker.clearRefresh(userId);

    return null;
  }

  // Track refresh attempts
  const refreshAttempts = ((token.refreshAttempts as number) || 0) + 1;

  // Create refresh promise
  const refreshPromise = (async (): Promise<JWT | null> => {
    try {
      console.log(`[Refresh] Attempting refresh (${refreshAttempts}/${MAX_REFRESH_ATTEMPTS})`);

      // Call Keycloak
      const data = await refreshTokenWithKeycloak(token.refresh_token as string);

      console.log('[Refresh] ✓ Token refreshed successfully');

      return createSuccessfulToken(token, data);
    } catch (error) {
      console.error('[Refresh] ✗ Token refresh failed:', error);

      // Check error type
      if (isTokenExpiredError(error)) {
        console.error('[Refresh] Refresh token expired - forcing logout');

        return null;
      }

      // Check if max attempts reached
      if (refreshAttempts >= MAX_REFRESH_ATTEMPTS) {
        console.error('[Refresh] Max attempts reached - forcing logout');

        return null;
      }

      // Temporary error - return token with error for retry
      if (isTemporaryError(error)) {
        console.warn(
          `[Refresh] Temporary error - will retry (${refreshAttempts}/${MAX_REFRESH_ATTEMPTS})`
        );
      } else {
        console.warn(
          `[Refresh] Unknown error - will retry (${refreshAttempts}/${MAX_REFRESH_ATTEMPTS})`
        );
      }

      return createFailedToken(token, false, refreshAttempts);
    } finally {
      // Always clear the refresh state for this user
      refreshTracker.clearRefresh(userId);
    }
  })();

  // Store the refresh promise
  refreshTracker.setRefreshPromise(userId, refreshPromise);

  return refreshPromise;
}
