/**
 * Auth Error Handler
 * Global handler for authentication errors including 403s
 *
 * @module core/auth/utils/error-handler
 */

import { hardLogout, shouldHardLogout } from './hard-logout';

let isHandlingSignin403 = false;

/**
 * Handle authentication errors globally
 */
export async function handleAuthError(error: unknown, context?: string): Promise<void> {
  console.error('[AuthError]', context || 'Authentication error occurred', error);

  // Check if it's a fetch response error
  if (error && typeof error === 'object' && 'status' in error) {
    const response = error as Response;

    if (shouldHardLogout(response)) {
      await hardLogout(`${response.status} error on ${context || 'unknown endpoint'}`);
    }
  }

  // Check if it's a session error
  if (error && typeof error === 'object' && 'error' in error) {
    const sessionError = error as { error: string };

    if (sessionError.error === 'RefreshAccessTokenError') {
      console.error('[AuthError] Token refresh failed permanently');
      await hardLogout('Token refresh failed');
    }
  }
}

/**
 * Wrap fetch calls with auth error handling
 */
export async function fetchWithAuthErrorHandler(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  try {
    const response = await fetch(input, init);

    // Check for auth errors
    if (shouldHardLogout(response)) {
      await hardLogout(`${response.status} error on ${input.toString()}`);
    }

    return response;
  } catch (error) {
    console.error('[FetchAuthError] Network error:', error);
    throw error;
  }
}

/**
 * Monitor and handle signin errors (for the specific 403 case)
 */
export function monitorSigninErrors(): void {
  if (typeof window === 'undefined') return;

  // Intercept fetch calls to detect signin failures
  const originalFetch = window.fetch;

  window.fetch = async function (...args) {
    const response = await originalFetch(...args);

    // Check for signin endpoint 403 errors
    const url = args[0]?.toString() || '';

    if (url.includes('/api/auth/signin') && response.status === 403) {
      if (!isHandlingSignin403) {
        isHandlingSignin403 = true;

        try {
          let shouldForceLogout = false;

          const sessionResponse = await originalFetch('/api/auth/session', {
            credentials: 'include',
          });

          if (sessionResponse.ok) {
            const sessionData = await sessionResponse.json().catch(() => null);
            shouldForceLogout =
              sessionData?.error === 'RefreshAccessTokenError' || sessionData?.shouldSignOut === true;
          }

          if (shouldForceLogout) {
            console.error('[SigninMonitor] 403 on signin with invalid session - hard logout');

            // Use setTimeout to avoid blocking the current call
            setTimeout(() => {
              hardLogout('403 Forbidden on signin endpoint');
            }, 100);
          } else {
            console.warn('[SigninMonitor] 403 on signin without invalid session - skipping hard logout');
          }
        } finally {
          isHandlingSignin403 = false;
        }
      }
    }

    return response;
  };

  console.log('[AuthErrorHandler] Signin error monitoring active');
}
