/**
 * Token Refresh Logic
 * Core functionality for refreshing access tokens
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
 * Handles all token refresh logic with proper error handling and retry
 */
export async function refreshAccessToken(token: JWT): Promise<JWT> {
  // Early exit: Token already marked for signout
  if (isMarkedForSignout(token)) {
    console.warn('[Refresh] Token already marked for signout, skipping refresh');

    return token;
  }

  // Get user ID
  const userId = getUserId(token);

  if (!userId) {
    console.error('[Refresh] No user ID in token, cannot refresh');

    return createFailedToken(token, true, 0);
  }

  // Check for concurrent refresh
  if (refreshTracker.isRefreshInProgress(userId)) {
    console.log(`[Refresh] Refresh already in progress for user ${userId}, waiting...`);
    const existingPromise = refreshTracker.getRefreshPromise(userId);

    return existingPromise || token;
  }

  // Check if token is too old
  if (isTokenTooOld(token)) {
    const age = getTokenAge(token);

    console.error(`[Refresh] Token is too old to refresh (${age}), forcing signout`);
    refreshTracker.clearRefresh(userId);

    return createFailedToken(token, true, 0);
  }

  // Check for refresh token
  if (!token.refresh_token) {
    console.warn('[Refresh] No refresh token available');
    refreshTracker.clearRefresh(userId);

    return createFailedToken(token, true, 0);
  }

  // Track refresh attempts
  const refreshAttempts = ((token.refreshAttempts as number) || 0) + 1;

  // Create refresh promise
  const refreshPromise = (async (): Promise<JWT> => {
    try {
      console.log(
        `[Refresh] Attempting token refresh (attempt ${refreshAttempts}/${MAX_REFRESH_ATTEMPTS})`
      );

      // Call Keycloak
      const data = await refreshTokenWithKeycloak(token.refresh_token as string);

      console.log('[Refresh] Token refreshed successfully');

      return createSuccessfulToken(token, data);
    } catch (error) {
      console.error('[Refresh] Token refresh error:', error);

      // Check error type
      if (isTokenExpiredError(error)) {
        console.error('[Refresh] Refresh token expired or invalid, forcing signout');

        return createFailedToken(token, true, refreshAttempts);
      }

      // Check if max attempts reached
      if (refreshAttempts >= MAX_REFRESH_ATTEMPTS) {
        console.error('[Refresh] Max refresh attempts reached, forcing signout');

        return createFailedToken(token, true, refreshAttempts);
      }

      // Temporary error - retry later
      if (isTemporaryError(error)) {
        console.warn(
          `[Refresh] Temporary error (attempt ${refreshAttempts}/${MAX_REFRESH_ATTEMPTS}), will retry`
        );
      } else {
        console.warn(
          `[Refresh] Unknown error (attempt ${refreshAttempts}/${MAX_REFRESH_ATTEMPTS}), will retry`
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
