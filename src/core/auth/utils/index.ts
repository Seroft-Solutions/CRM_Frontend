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
 * Parse roles from Keycloak access token
 */
export function parseRoles(accessToken: string): string[] {
  try {
    const [, payload] = accessToken.split('.');
    if (!payload) return [];

    const decoded: KeycloakTokenPayload = JSON.parse(atob(payload));
    
    console.log('🔧 [parseRoles] Token payload structure:', {
      realm_access: decoded.realm_access,
      resource_access: decoded.resource_access,
      roles: decoded.roles,
      groups: decoded.groups,
      allKeys: Object.keys(decoded)
    });

    const roles: string[] = [];

    // Get realm roles
    if (decoded.realm_access?.roles) {
      console.log('🔧 [parseRoles] Found realm roles:', decoded.realm_access.roles);
      roles.push(...decoded.realm_access.roles.map(normalizeRole));
    }

    // Get client roles (resource_access)
    if (decoded.resource_access) {
      console.log('🔧 [parseRoles] Found resource_access:', decoded.resource_access);
      Object.values(decoded.resource_access).forEach((client) => {
        if (client.roles) {
          console.log('🔧 [parseRoles] Found client roles:', client.roles);
          roles.push(...client.roles.map(normalizeRole));
        }
      });
    }

    // Check if roles are in a different location
    if (decoded.roles && Array.isArray(decoded.roles)) {
      console.log('🔧 [parseRoles] Found direct roles:', decoded.roles);
      roles.push(...decoded.roles.map(normalizeRole));
    }

    console.log('🔧 [parseRoles] Final roles:', roles);
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
 * Fetch user roles dynamically from the current session's access token
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
