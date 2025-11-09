/**
 * Token Refresh Utilities
 * Keycloak token refresh implementation
 */

import type { TokenRefreshResult } from '../types';

export async function refreshKeycloakToken(refreshToken: string): Promise<TokenRefreshResult> {
  try {
    const tokenUrl = `${process.env.AUTH_KEYCLOAK_ISSUER}/protocol/openid-connect/token`;

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: process.env.AUTH_KEYCLOAK_ID!,
        client_secret: process.env.AUTH_KEYCLOAK_SECRET!,
        refresh_token: refreshToken,
      }),
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
    const { useSession } = await import('next-auth/react');

    return true;
  } catch (error) {
    console.error('Session refresh error:', error);
    return false;
  }
}
