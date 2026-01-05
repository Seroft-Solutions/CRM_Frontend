/**
 * Hard Logout Utility
 * Forces a complete logout with full cleanup
 *
 * @module core/auth/utils/hard-logout
 */

import { clearAuthStorage } from '@/lib/auth-cleanup';

/**
 * Perform a hard logout
 * Clears all auth storage and redirects to home page
 * Use this when normal logout fails or when session is corrupted
 */
export async function hardLogout(reason?: string): Promise<never> {
  console.warn('[HardLogout] Initiating hard logout', reason ? `Reason: ${reason}` : '');

  try {
    // Clear all auth-related storage
    clearAuthStorage();

    // Try to call the signout API with a CSRF token to clear server-side session
    try {
      const csrfResponse = await fetch('/api/auth/csrf', { credentials: 'include' });
      if (csrfResponse.ok) {
        const csrfData = await csrfResponse.json().catch(() => null);
        const csrfToken = csrfData?.csrfToken;

        if (csrfToken) {
          const body = new URLSearchParams({
            csrfToken,
            callbackUrl: '/',
          });

          await fetch('/api/auth/signout', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body,
            credentials: 'include',
          });
        } else {
          console.warn('[HardLogout] Missing CSRF token for signout');
        }
      } else {
        console.warn('[HardLogout] Failed to fetch CSRF token for signout');
      }
    } catch (error) {
      console.warn('[HardLogout] Failed to call signout API:', error);
    }

    // Force redirect to home page
    console.log('[HardLogout] Redirecting to home page');
    window.location.href = '/';

    // Prevent further code execution
    return new Promise(() => {}) as never;
  } catch (error) {
    console.error('[HardLogout] Error during hard logout:', error);

    // Last resort - just redirect
    window.location.href = '/';

    return new Promise(() => {}) as never;
  }
}

/**
 * Check if we should perform a hard logout based on error response
 */
export function shouldHardLogout(response: Response | null): boolean {
  if (!response) return false;

  // 403 Forbidden - likely auth issue
  if (response.status === 403) {
    console.warn('[HardLogout] 403 detected - auth token may be invalid');

    return true;
  }

  // 401 Unauthorized on signin endpoint
  if (response.status === 401 && response.url.includes('/api/auth/signin')) {
    console.warn('[HardLogout] 401 on signin - session may be corrupted');

    return true;
  }

  return false;
}
