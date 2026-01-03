/**
 * NextAuth Configuration
 * Central authentication configuration for the application
 */

import NextAuth from 'next-auth';
import Keycloak from 'next-auth/providers/keycloak';
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

const REFRESH_BUFFER_SECONDS = 60;
const refreshInFlight = new Map<string, Promise<JWT>>();

// Global refresh lock to prevent concurrent refresh attempts
let refreshPromise: Promise<JWT> | null = null;
let lastRefreshAttempt = 0;
const MIN_REFRESH_INTERVAL = 2000; // Minimum 2 seconds between refresh attempts

async function refreshAccessToken(token: JWT): Promise<JWT> {
  // Early exit conditions
  if (
    token.shouldSignOut ||
    (token.error === 'RefreshAccessTokenError' &&
      token.refreshAttempts &&
      token.refreshAttempts >= 3)
  ) {
    console.warn('Token already marked for signout or max refresh attempts reached');
    return token;
  }

  // Prevent concurrent refresh attempts - return existing promise if refresh is in progress
  const now = Date.now();
  if (refreshPromise && now - lastRefreshAttempt < MIN_REFRESH_INTERVAL) {
    console.log('Refresh already in progress, waiting for existing refresh...');
    return refreshPromise;
  }

  // Check if token is too old to refresh (more than 24 hours expired)
  if (token.expires_at && typeof token.expires_at === 'number') {
    const tokenAge = now / 1000 - token.expires_at;
    if (tokenAge > 86400) {
      // More than 24 hours expired
      console.error(
        `Token is too old to refresh (expired ${Math.floor(tokenAge / 3600)} hours ago), forcing signout`
      );
      refreshPromise = null;
      return { ...token, error: 'RefreshAccessTokenError', shouldSignOut: true };
    }
  }

  try {
    if (!token.refresh_token) {
      console.warn('No refresh token available for token refresh');
      refreshPromise = null;
      return { ...token, error: 'RefreshAccessTokenError', shouldSignOut: true };
    }

    lastRefreshAttempt = now;
    const refreshAttempts = ((token.refreshAttempts as number) || 0) + 1;

    // Create and store the refresh promise
    refreshPromise = (async () => {
      try {
        const tokenUrl = `${process.env.AUTH_KEYCLOAK_ISSUER}/protocol/openid-connect/token`;
        const response = await fetch(tokenUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            grant_type: 'refresh_token',
            client_id: process.env.AUTH_KEYCLOAK_ID!,
            client_secret: process.env.AUTH_KEYCLOAK_SECRET!,
            refresh_token: token.refresh_token as string,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Failed to refresh token:', {
            status: response.status,
            statusText: response.statusText,
            error: errorText,
            tokenUrl,
            attempt: refreshAttempts,
            timestamp: new Date().toISOString(),
          });

          if (response.status === 400 || response.status === 401) {
            let errorDetails;
            try {
              errorDetails = JSON.parse(errorText);
            } catch (e) {
              errorDetails = { error: 'invalid_grant', error_description: errorText };
            }

            console.error('Refresh token expired or invalid:', errorDetails);
            return { ...token, error: 'RefreshAccessTokenError', shouldSignOut: true, refreshAttempts };
          }

          if (refreshAttempts >= 3) {
            console.error('Max refresh attempts reached, marking for signout');
            return { ...token, error: 'RefreshAccessTokenError', shouldSignOut: true, refreshAttempts };
          }

          console.warn(
            `Temporary refresh token error (attempt ${refreshAttempts}/3), will retry:`,
            response.status
          );
          return { ...token, error: 'RefreshAccessTokenError', refreshAttempts };
        }

        const data = await response.json();

        if (!data.access_token) {
          console.error('Invalid token response: missing access_token', data);
          return { ...token, error: 'RefreshAccessTokenError', shouldSignOut: true, refreshAttempts };
        }

        console.log('Token refreshed successfully on attempt', refreshAttempts);
        // Clear lock on successful refresh
        refreshPromise = null;

        return {
          ...token,
          access_token: data.access_token,
          refresh_token: data.refresh_token ?? token.refresh_token,
          id_token: data.id_token ?? token.id_token,
          expires_at: Math.floor(Date.now() / 1000) + (data.expires_in || 3600),
          error: undefined,
          shouldSignOut: undefined,
          refreshAttempts: 0,
          lastRefreshAt: Math.floor(Date.now() / 1000),
        };
      } catch (error) {
        console.error('Network or other error refreshing access token:', error);
        const retryAttempts = ((token.refreshAttempts as number) || 0) + 1;

        if (retryAttempts >= 3) {
          console.error('Max network error attempts reached, marking for signout');
          return {
            ...token,
            error: 'RefreshAccessTokenError',
            shouldSignOut: true,
            refreshAttempts: retryAttempts,
          };
        }

        return { ...token, error: 'RefreshAccessTokenError', refreshAttempts: retryAttempts };
      }
    })();

    return refreshPromise;
  } catch (error) {
    // Outer catch for synchronous errors
    console.error('Unexpected error in refreshAccessToken:', error);
    refreshPromise = null;
    return { ...token, error: 'RefreshAccessTokenError', shouldSignOut: true };
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Keycloak({
      clientId: process.env.AUTH_KEYCLOAK_ID!,
      clientSecret: process.env.AUTH_KEYCLOAK_SECRET!,
      issuer: process.env.AUTH_KEYCLOAK_ISSUER!,
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60,
  },
  pages: {
    error: '/auth/error',
  },
  logger: {
    error(error: Error) {
      console.error('NextAuth Error:', error);
    },
    warn(code: string) {
      console.warn(`NextAuth Warning: ${code}`);
    },
    debug(code: string, metadata?: any) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`NextAuth Debug: ${code}`, metadata);
      }
    },
  },
  callbacks: {
    async jwt({ token, account, trigger }) {
      // Fresh login from Keycloak
      if (account?.provider === 'keycloak') {
        console.log('Initial Keycloak login, setting up token');
        // Reset refresh promise on new login
        refreshPromise = null;
        lastRefreshAttempt = 0;

        token.id_token = account.id_token;
        token.access_token = account.access_token;
        token.refresh_token = account.refresh_token;
        token.expires_at = Math.floor(Date.now() / 1000) + (account.expires_in ?? 3600);
        token.error = undefined;
        token.shouldSignOut = undefined;
        token.refreshAttempts = 0;

        return token;
      }

      // Check if token is marked for signout - block ALL operations
      if (
        token.shouldSignOut ||
        (token.error === 'RefreshAccessTokenError' &&
          token.refreshAttempts &&
          token.refreshAttempts >= 3)
      ) {
        console.warn('[JWT] Token marked for signout, blocking refresh attempts');
        return token;
      }

      // Handle manual update trigger
      if (trigger === 'update') {
        console.log('[JWT] Manual update triggered, checking token validity');
        if (token.error === 'RefreshAccessTokenError' && token.shouldSignOut) {
          return token;
        }
      }

      const now = Date.now() / 1000;
      const timeLeft = token.expires_at ? (token.expires_at as number) - now : 0;
      const shouldRefresh =
        token.expires_at &&
        typeof token.expires_at === 'number' &&
        now >= token.expires_at - REFRESH_BUFFER_SECONDS;

      if (shouldRefresh && !token.shouldSignOut) {
        console.log('[JWT] Token expires soon, initiating refresh', {
          expiresAt: token.expires_at,
          now: Math.floor(now),
          timeLeft: Math.floor(timeLeft),
          attempt: ((token.refreshAttempts as number) || 0) + 1,
        });

        token = await refreshAccessToken(token);

        if (token.error === 'RefreshAccessTokenError' && token.shouldSignOut) {
          console.error('[JWT] Token refresh failed permanently - user must sign in again');
        } else if (token.error === 'RefreshAccessTokenError') {
          console.warn('[JWT] Token refresh failed, will retry when token expires again');
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token.error === 'RefreshAccessTokenError' && token.shouldSignOut) {
        session.error = 'RefreshAccessTokenError';
        return session;
      }

      if (token.sub) {
        session.user.id = token.sub;
      }

      if (token.access_token && typeof token.access_token === 'string') {
        session.access_token = token.access_token;
      }

      if (token.refresh_token && typeof token.refresh_token === 'string') {
        session.refresh_token = token.refresh_token;
      }

      if (token.error) {
        session.error = token.error;
      }

      return session;
    },
    authorized({ auth, request }) {
      const { nextUrl } = request;

      // CRITICAL: Always allow NextAuth API routes (signin, signout, session, etc.)
      // These must NEVER be blocked, even during logout
      if (nextUrl.pathname.startsWith('/api/auth')) {
        return true;
      }

      // Check if logout is in progress
      const logoutCookie = request.cookies.get('LOGOUT_IN_PROGRESS');
      const isLoggingOut = logoutCookie?.value === 'true';

      if (isLoggingOut) {
        console.log('[Middleware] Logout in progress, allowing navigation to:', nextUrl.pathname);
        // Allow navigation to safe pages during logout
        if (nextUrl.pathname === '/' || nextUrl.pathname.startsWith('/auth')) {
          return true;
        }
        return false;
      }

      const isLoggedIn = !!auth?.user;
      const hasValidSession = isLoggedIn && !auth?.error;
      const isProtected =
        nextUrl.pathname.startsWith('/dashboard') ||
        nextUrl.pathname.startsWith('/areas') ||
        nextUrl.pathname.startsWith('/calls') ||
        nextUrl.pathname.startsWith('/parties') ||
        nextUrl.pathname.startsWith('/user-management') ||
        nextUrl.pathname.startsWith('/cities') ||
        nextUrl.pathname.startsWith('/districts') ||
        nextUrl.pathname.startsWith('/states') ||
        nextUrl.pathname.startsWith('/products') ||
        nextUrl.pathname.startsWith('/sources') ||
        nextUrl.pathname.startsWith('/priorities') ||
        nextUrl.pathname.startsWith('/call-types') ||
        nextUrl.pathname.startsWith('/sub-call-types') ||
        nextUrl.pathname.startsWith('/call-categories') ||
        nextUrl.pathname.startsWith('/call-statuses') ||
        nextUrl.pathname.startsWith('/call-remarks') ||
        nextUrl.pathname.startsWith('/channel-types') ||
        nextUrl.pathname.startsWith('/organizations');

      const isOrganizationFlow = nextUrl.pathname.startsWith('/organization');

      if (isProtected) {
        if (hasValidSession) return true;
        return false;
      } else if (isOrganizationFlow) {
        if (hasValidSession) return true;
        return false;
      } else if (hasValidSession && nextUrl.pathname === '/') {
        console.log('[Middleware] Authenticated user at root, redirecting to /organization');
        return Response.redirect(new URL('/organization', nextUrl));
      }

      return true;
    },
  },
  events: {
    async signOut(params) {
      // Clear refresh promise to allow fresh authentication
      refreshPromise = null;
      lastRefreshAttempt = 0;

      console.log('[SignOut Event] Starting Keycloak logout');
      const token = 'token' in params ? params.token : null;

      if (token?.id_token && typeof token.id_token === 'string') {
        try {
          const keycloakIssuer = process.env.AUTH_KEYCLOAK_ISSUER;
          const authUrl = process.env.AUTH_URL;

          if (!keycloakIssuer || !authUrl) {
            console.error('[SignOut] Missing KEYCLOAK_ISSUER or AUTH_URL');
            return;
          }

          const logoutUrl = new URL(`${keycloakIssuer}/protocol/openid-connect/logout`);
          logoutUrl.searchParams.set('id_token_hint', token.id_token as string);
          logoutUrl.searchParams.set('post_logout_redirect_uri', authUrl);

          console.log('[SignOut] Calling Keycloak logout endpoint:', logoutUrl.origin);

          const response = await fetch(logoutUrl.toString(), {
            method: 'GET',
            headers: {
              Accept: 'application/json',
            },
            signal: AbortSignal.timeout(5000), // 5 second timeout
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error('[SignOut] Keycloak logout failed:', {
              status: response.status,
              statusText: response.statusText,
              error: errorText,
            });
            console.warn('[SignOut] Continuing with logout despite Keycloak error');
          } else {
            console.log('[SignOut] Keycloak logout successful');
          }
        } catch (error) {
          if (error instanceof Error) {
            console.error('[SignOut] Keycloak logout error:', {
              message: error.message,
              name: error.name,
            });
          } else {
            console.error('[SignOut] Keycloak logout error:', error);
          }
          console.warn('[SignOut] Continuing with NextAuth logout despite error');
        }
      } else {
        console.warn('[SignOut] No id_token available for Keycloak logout');
      }

      console.log('[SignOut] Keycloak logout process completed');
    },
  },
  trustHost: true,
});
