/**
 * Token Refresh Utilities
 * Keycloak token refresh implementation
 */

import type { TokenRefreshResult } from '../types';

export async function refreshKeycloakToken(refreshToken: string): Promise<TokenRefreshResult> {
  try {
    const tokenUrl = `${process.env.AUTH_KEYCLOAK_ISSUER}/protocol/openid-connect/token`;
    const clientSecret = process.env.AUTH_KEYCLOAK_SECRET;
    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: process.env.AUTH_KEYCLOAK_ID!,
      refresh_token: refreshToken,
    });

    if (clientSecret) {
      body.set('client_secret', clientSecret);
    }

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Token refresh failed:', response.status, errorData);
      return {
        success: false,
        error: `HTTP ${response.status}: ${errorData}`,
      };
    }

    const data = await response.json();

    return {
      success: true,
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
    };
  } catch (error) {
    console.error('Token refresh error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function refreshSession(): Promise<boolean> {
  try {
    const response = await fetch('/api/auth/session', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      return false;
    }

    const session = await response.json();
    return !!session?.user && !session?.error;
  } catch (error) {
    console.error('Session refresh error:', error);
    return false;
  }
}
