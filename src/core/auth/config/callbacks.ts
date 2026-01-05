/**
 * NextAuth Callback Handlers
 * Clean, maintainable callback logic with proper error handling
 *
 * @module core/auth/config/callbacks
 */

import type { JWT } from 'next-auth/jwt';
import type { Session } from 'next-auth';
import type { Account } from 'next-auth';
import { refreshAccessToken } from './token-refresh';
import { isMarkedForSignout, shouldRefreshToken } from './token-validation';
import { DEFAULT_TOKEN_EXPIRY } from './constants';
import {
  isProtectedRoute,
  isOrganizationRoute,
  shouldRedirectFromRoot,
  DEFAULT_LOGIN_REDIRECT,
} from './protected-routes';

/**
 * Create a clean token for new login
 */
function handleKeycloakLogin(token: JWT, account: Account): JWT {
  console.log('[JWT] New Keycloak login - initializing token');

  return {
    ...token,
    id_token: account.id_token,
    access_token: account.access_token,
    refresh_token: account.refresh_token,
    expires_at: Math.floor(Date.now() / 1000) + (account.expires_in ?? DEFAULT_TOKEN_EXPIRY),
    error: undefined,
    shouldSignOut: undefined,
    refreshAttempts: 0,
  };
}

/**
 * Handle token that should be signed out
 * Returns null to force NextAuth to clear the session
 */
function handleSignoutToken(): null {
  console.error('[JWT] Token marked for signout - forcing session cleanup');

  return null;
}

/**
 * Handle token refresh when it's about to expire
 */
async function handleTokenRefresh(token: JWT): Promise<JWT | null> {
  const now = Date.now() / 1000;
  const timeLeft = token.expires_at ? token.expires_at - now : 0;

  console.log('[JWT] Token refresh needed', {
    timeLeft: Math.floor(timeLeft),
    attempt: ((token.refreshAttempts as number) || 0) + 1,
  });

  const refreshedToken = await refreshAccessToken(token);

  // If refresh failed permanently, return null to clear session
  if (refreshedToken === null) {
    console.error('[JWT] Token refresh failed permanently - clearing session');

    return null;
  }

  if (refreshedToken.error === 'RefreshAccessTokenError' && refreshedToken.shouldSignOut) {
    console.error('[JWT] Token refresh failed with shouldSignOut - clearing session');

    return null;
  }

  if (refreshedToken.error === 'RefreshAccessTokenError') {
    console.warn('[JWT] Token refresh failed, will retry on next request');
  }

  return refreshedToken;
}

/**
 * JWT Callback
 * Handles token lifecycle with proper cleanup on errors
 *
 * Key: Returning null forces NextAuth to clear the session completely
 */
export async function jwtCallback({
  token,
  account,
  trigger,
}: {
  token: JWT;
  account?: Account | null;
  trigger?: 'signIn' | 'signUp' | 'update';
}): Promise<JWT | null> {
  // 1. Handle new Keycloak login - always create fresh token
  if (account?.provider === 'keycloak') {
    return handleKeycloakLogin(token, account);
  }

  // 2. Handle token marked for signout - clear session
  if (isMarkedForSignout(token)) {
    return handleSignoutToken();
  }

  // 3. Handle manual update trigger - validate current token
  if (trigger === 'update') {
    // Check if token is still valid
    if (isMarkedForSignout(token)) {
      return handleSignoutToken();
    }
    console.log('[JWT] Manual session update');

    return token;
  }

  // 4. Check if token needs refresh
  if (shouldRefreshToken(token)) {
    return handleTokenRefresh(token);
  }

  // 5. Retry failed refresh (if error exists but not marked for signout)
  if (token.error === 'RefreshAccessTokenError' && !token.shouldSignOut) {
    console.log('[JWT] Retrying failed token refresh');

    return handleTokenRefresh(token);
  }

  // 6. Token is valid, return as-is
  return token;
}

/**
 * Session Callback
 * Transforms JWT into session object for client
 */
export async function sessionCallback({
  session,
  token,
}: {
  session: Session;
  token: JWT;
}): Promise<Session> {
  // Handle refresh error that requires signout
  if (token.error === 'RefreshAccessTokenError' && token.shouldSignOut) {
    console.error('[Session] Refresh error detected, session will be invalid');
    session.error = 'RefreshAccessTokenError';

    return session;
  }

  // Populate session with user data
  if (token.sub) {
    session.user.id = token.sub;
  }

  // Add tokens to session (for API calls)
  if (token.access_token) {
    session.access_token = token.access_token;
  }

  if (token.refresh_token) {
    session.refresh_token = token.refresh_token;
  }

  // Add error state if present (for client-side handling)
  if (token.error) {
    session.error = token.error;
  }

  return session;
}

/**
 * Authorized Callback
 * Checks if user is authorized to access a route
 */
export function authorizedCallback({
  auth,
  request,
}: {
  auth: { user?: unknown; error?: string } | null;
  request: { nextUrl: URL };
}): boolean | Response {
  const { nextUrl } = request;
  const isLoggedIn = !!auth?.user;
  const hasValidSession = isLoggedIn && !auth?.error;

  // Check if route is protected
  if (isProtectedRoute(nextUrl.pathname)) {
    return hasValidSession;
  }

  // Check if route is organization flow
  if (isOrganizationRoute(nextUrl.pathname)) {
    return hasValidSession;
  }

  // Redirect authenticated users from root to default page
  if (shouldRedirectFromRoot(nextUrl.pathname, hasValidSession)) {
    return Response.redirect(new URL(DEFAULT_LOGIN_REDIRECT, nextUrl));
  }

  // Public route - allow access
  return true;
}
