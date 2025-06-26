/**
 * Authentication utility functions
 * Centralized location for all auth-related utility functions
 */

import { signOut } from 'next-auth/react';
import type { KeycloakTokenPayload } from '../types';

// Re-export server actions
export { logoutAction } from './actions';

/**
 * Parse roles from Keycloak access token
 */
export function parseRoles(accessToken: string): string[] {
  try {
    const [, payload] = accessToken.split('.');
    if (!payload) return [];

    const decoded: KeycloakTokenPayload = JSON.parse(atob(payload));

    const roles: string[] = [];

    // Get realm roles
    if (decoded.realm_access?.roles) {
      roles.push(...decoded.realm_access.roles);
    }

    // Get client roles (resource_access)
    if (decoded.resource_access) {
      Object.values(decoded.resource_access).forEach((client) => {
        if (client.roles) {
          roles.push(...client.roles);
        }
      });
    }

    return [...new Set(roles)]; // Remove duplicates
  } catch (error) {
    console.error('Failed to parse roles from token:', error);
    return [];
  }
}

/**
 * Parse groups from Keycloak access token
 */
export function parseGroups(accessToken: string): string[] {
  try {
    const [, payload] = accessToken.split('.');
    if (!payload) return [];

    const decoded: KeycloakTokenPayload = JSON.parse(atob(payload));

    // Get groups from token
    const groups = decoded.groups || [];

    return [...new Set(groups)]; // Remove duplicates
  } catch (error) {
    console.error('Failed to parse groups from token:', error);
    return [];
  }
}

/**
 * Logout utility function that handles both NextAuth and Keycloak logout
 */
export async function logout() {
  try {
    // NextAuth v5 will automatically handle Keycloak logout via the signOut event
    await signOut({
      callbackUrl: '/',
      redirect: true,
    });
  } catch (error) {
    console.error('Logout error:', error);
    // Fallback: redirect to home page
    window.location.href = '/';
  }
}

/**
 * Silent logout (useful for token expiration scenarios)
 */
export async function silentLogout() {
  try {
    await signOut({
      redirect: false,
    });
  } catch (error) {
    console.error('Silent logout error:', error);
  }
}

/**
 * Get access token from various sources
 */
export async function fetchAccessToken(): Promise<string | null> {
  try {
    if (typeof window !== 'undefined') {
      try {
        const response = await fetch('/api/auth/session');
        if (response.ok) {
          const session = await response.json();
          if (session?.access_token) {
            return session.access_token as string;
          }
        }
      } catch (error) {
        console.warn('Auth session fetch failed:', error);
      }
      const { tokenStorage } = await import('../tokens');
      return tokenStorage.getToken() || tokenStorage.getTokenSession();
    }
    const { getAccessToken } = await import('@/lib/dal');
    const token = await getAccessToken();
    return token;
  } catch (error) {
    console.error('Error getting access token:', error);
    return null;
  }
}

/**
 * Check if token is expired
 */
export function isTokenExpired(token: string): boolean {
  try {
    const [, payload] = token.split('.');
    if (!payload) return true;

    const decoded: KeycloakTokenPayload = JSON.parse(atob(payload));
    const expiryTime = decoded.exp * 1000;
    const currentTime = Date.now();

    return currentTime >= expiryTime;
  } catch (error) {
    console.error('Error checking token expiry:', error);
    return true;
  }
}

/**
 * Get token expiry time in minutes
 */
export function getTokenExpiryMinutes(token: string): number {
  try {
    const [, payload] = token.split('.');
    if (!payload) return 0;

    const decoded: KeycloakTokenPayload = JSON.parse(atob(payload));
    const expiryTime = decoded.exp * 1000;
    const currentTime = Date.now();
    const timeUntilExpiry = expiryTime - currentTime;

    return Math.floor(timeUntilExpiry / 60000);
  } catch (error) {
    console.error('Error getting token expiry:', error);
    return 0;
  }
}
