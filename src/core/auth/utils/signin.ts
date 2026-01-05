/**
 * Safe Keycloak sign-in helper
 * Falls back to direct navigation if the Auth.js POST flow fails (403/CSRF).
 */

'use client';

export async function startKeycloakSignIn(redirectTo?: string): Promise<void> {
  if (typeof window === 'undefined') return;

  const resolvedRedirect =
    redirectTo && redirectTo.length > 0
      ? new URL(redirectTo, window.location.origin).toString()
      : window.location.href;

  try {
    const sessionResponse = await fetch('/api/auth/session', { credentials: 'include' });
    if (sessionResponse.ok) {
      const sessionData = await sessionResponse.json().catch(() => null);
      if (sessionData?.user) {
        window.location.href = resolvedRedirect;
        return;
      }
    }
  } catch (error) {
    console.warn('[Auth] session check failed before sign-in:', error);
  }

  const callbackUrl = encodeURIComponent(resolvedRedirect);
  window.location.href = `/api/auth/signin/keycloak?callbackUrl=${callbackUrl}`;
}
