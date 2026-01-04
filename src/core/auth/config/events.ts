/**
 * NextAuth Event Handlers
 * Handles authentication lifecycle events
 */

import type { JWT } from 'next-auth/jwt';
import { logoutFromKeycloak } from './keycloak-service';

/**
 * Handle signOut event
 * Ensures Keycloak session is also terminated
 */
export async function signOutEvent(message: { session: unknown } | { token: JWT }): Promise<void> {
  // Extract token from the message
  const token = 'token' in message ? message.token : null;

  if (!token?.id_token) {
    console.log('[SignOut] No ID token available, skipping Keycloak logout');

    return;
  }

  const authUrl = process.env.AUTH_URL;

  if (!authUrl) {
    console.warn('[SignOut] Missing AUTH_URL for logout redirect');

    return;
  }

  try {
    console.log('[SignOut] Logging out from Keycloak');
    await logoutFromKeycloak(token.id_token as string, authUrl);
    console.log('[SignOut] Successfully logged out from Keycloak');
  } catch (error) {
    console.error('[SignOut] Keycloak logout error:', error);
  }
}
