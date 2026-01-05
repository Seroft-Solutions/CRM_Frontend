/**
 * NextAuth Callback Handlers
 * Separated callback logic for better maintainability
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
 * Handle initial Keycloak login
 */
function handleKeycloakLogin(token: JWT, account: Account): JWT {
  console.log('[JWT Callback] Initial Keycloak login, setting up token');

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
 * Handle token marked for signout
 */
function handleSignoutToken(token: JWT): JWT {
  console.warn('[JWT Callback] Token marked for signout, blocking operations');

  return token;
}

/**
 * Handle manual update trigger
 */
function handleManualUpdate(token: JWT): JWT {
  console.log('[JWT Callback] Manual update triggered, checking token validity');

  return token;
}

/**
 * Handle token refresh logic
 */
async function handleTokenRefresh(token: JWT): Promise<JWT> {
  const now = Date.now() / 1000;
  const timeLeft = token.expires_at ? token.expires_at - now : 0;

  console.log('[JWT Callback] Token expires soon, initiating refresh', {
    expiresAt: token.expires_at,
    now: Math.floor(now),
    timeLeft: Math.floor(timeLeft),
    attempt: ((token.refreshAttempts as number) || 0) + 1,
  });

  const refreshedToken = await refreshAccessToken(token);

  if (refreshedToken.error === 'RefreshAccessTokenError' && refreshedToken.shouldSignOut) {
    console.error('[JWT Callback] Token refresh failed permanently - user must sign in again');
  } else if (refreshedToken.error === 'RefreshAccessTokenError') {
    console.warn('[JWT Callback] Token refresh failed, will retry on next request');
  }

  return refreshedToken;
}

/**
 * Handle token refresh retry
 */
async function handleRefreshRetry(token: JWT): Promise<JWT> {
  console.log('[JWT Callback] Retrying token refresh after previous failure');

  return refreshAccessToken(token);
}

/**
 * JWT Callback
 * Handles token management and refresh
 */
export async function jwtCallback({
  token,
  account,
  trigger,
}: {
  token: JWT;
  account?: Account | null;
  trigger?: 'signIn' | 'signUp' | 'update';
}): Promise<JWT> {
  // 1. Handle initial Keycloak login
  if (account?.provider === 'keycloak') {
    return handleKeycloakLogin(token, account);
  }

  // 2. Handle token marked for signout
  if (isMarkedForSignout(token)) {
    return handleSignoutToken(token);
  }

  // 3. Handle manual update trigger
  if (trigger === 'update') {
    return handleManualUpdate(token);
  }

  // 4. Check if token needs refresh
  if (shouldRefreshToken(token)) {
    return handleTokenRefresh(token);
  }

  // 5. Retry failed refresh (if error exists but not marked for signout)
  if (token.error === 'RefreshAccessTokenError' && !token.shouldSignOut) {
    return handleRefreshRetry(token);
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
  // Handle refresh error
  if (token.error === 'RefreshAccessTokenError' && token.shouldSignOut) {
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

  // Add error state if present
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
