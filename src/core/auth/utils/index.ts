/**
 * Authentication utility functions
 * Centralized location for all auth-related utility functions
 */

import { signOut } from 'next-auth/react';
import type { KeycloakTokenPayload } from '../types';

// Re-export server actions
export { logoutAction } from './actions';

/**
 * Normalize role name by removing ROLE_ prefix if present
 * This ensures consistent role checking across the application
 */
export function normalizeRole(role: string): string {
  return role.startsWith('ROLE_') ? role.substring(5) : role;
}

/**
 * Normalize group name by removing GROUP_ prefix if present
 * This ensures consistent group checking across the application
 */
export function normalizeGroup(group: string): string {
  return group.startsWith('GROUP_') ? group.substring(6) : group;
}

/**
 * Normalize authority (role or group) by removing prefixes
 * This function handles both ROLE_ and GROUP_ prefixes
 */
export function normalizeAuthority(authority: string): string {
  if (authority.startsWith('ROLE_')) {
    return authority.substring(5);
  }
  if (authority.startsWith('GROUP_')) {
    return authority.substring(6);
  }
  return authority;
}

/**
 * Parse roles from Keycloak access token
 * @deprecated - Use backend API /api/account instead for role fetching
 * This function is kept for backward compatibility only
 */
export function parseRoles(accessToken: string): string[] {
  try {
    const [, payload] = accessToken.split('.');
    if (!payload) return [];

    const decoded: KeycloakTokenPayload = JSON.parse(atob(payload));
    const roles: string[] = [];

    // Get realm roles
    if (decoded.realm_access?.roles) {
      roles.push(...decoded.realm_access.roles.map(normalizeRole));
    }

    // Get client roles (resource_access)
    if (decoded.resource_access) {
      Object.values(decoded.resource_access).forEach((client) => {
        if (client.roles) {
          roles.push(...client.roles.map(normalizeRole));
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
 * @deprecated - Use backend API /api/account instead for group fetching
 * This function is kept for backward compatibility only
 */
export function parseGroups(accessToken: string): string[] {
  try {
    const [, payload] = accessToken.split('.');
    if (!payload) return [];

    const decoded: KeycloakTokenPayload = JSON.parse(atob(payload));
    const groups = decoded.groups || [];
    return [...new Set(groups.map(normalizeGroup))]; // Remove duplicates and normalize
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
 * Fetch user roles dynamically from the current session's access token
 * @deprecated - Use useUserRoles hook or backend API /api/account instead
 * This is used instead of storing roles in the session to avoid size limits
 */
export async function fetchUserRoles(): Promise<string[]> {
  try {
    // Import auth dynamically to avoid circular dependencies
    const { auth } = await import('../config/nextauth');
    const session = await auth();

    if (!session?.access_token) {
      return [];
    }

    return parseRoles(session.access_token);
  } catch (error) {
    console.error('Failed to fetch user roles:', error);
    return [];
  }
}

/**
 * Fetch user groups dynamically from the current session's access token
 * @deprecated - Use useUserRoles hook or backend API /api/account instead
 * This is used instead of storing groups in the session to avoid size limits
 */
export async function fetchUserGroups(): Promise<string[]> {
  try {
    // Import auth dynamically to avoid circular dependencies
    const { auth } = await import('../config/nextauth');
    const session = await auth();

    if (!session?.access_token) {
      return [];
    }

    return parseGroups(session.access_token);
  } catch (error) {
    console.error('Failed to fetch user groups:', error);
    return [];
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
