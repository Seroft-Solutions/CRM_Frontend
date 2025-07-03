/**
 * Updated Authentication Utility Functions
 * Updated to work with Spring-based role system instead of JWT roles
 */

import { signOut } from 'next-auth/react';
import { springRoleService } from '../services/spring-role.service';

// Re-export server actions
export { logoutAction } from './actions';

/**
 * Note: parseRoles and parseGroups are deprecated
 * Roles and groups are now fetched from Spring Database
 */

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

    const decoded = JSON.parse(atob(payload));
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

    const decoded = JSON.parse(atob(payload));
    const expiryTime = decoded.exp * 1000;
    const currentTime = Date.now();
    const timeUntilExpiry = expiryTime - currentTime;

    return Math.floor(timeUntilExpiry / 60000);
  } catch (error) {
    console.error('Error getting token expiry:', error);
    return 0;
  }
}

/**
 * Get user roles from Spring Database
 */
export async function getUserRoles(keycloakId: string): Promise<string[]> {
  try {
    return await springRoleService.getUserRoles(keycloakId);
  } catch (error) {
    console.error('Error getting user roles:', error);
    return [];
  }
}

/**
 * Get user groups from Spring Database
 */
export async function getUserGroups(keycloakId: string): Promise<string[]> {
  try {
    return await springRoleService.getUserGroups(keycloakId);
  } catch (error) {
    console.error('Error getting user groups:', error);
    return [];
  }
}

/**
 * Check if user has a specific role
 */
export async function hasRole(keycloakId: string, role: string): Promise<boolean> {
  try {
    return await springRoleService.hasRole(keycloakId, role);
  } catch (error) {
    console.error('Error checking user role:', error);
    return false;
  }
}

/**
 * Check if user has any of the specified roles
 */
export async function hasAnyRole(keycloakId: string, roles: string[]): Promise<boolean> {
  try {
    return await springRoleService.hasAnyRole(keycloakId, roles);
  } catch (error) {
    console.error('Error checking user roles:', error);
    return false;
  }
}

/**
 * Check if user has all of the specified roles
 */
export async function hasAllRoles(keycloakId: string, roles: string[]): Promise<boolean> {
  try {
    return await springRoleService.hasAllRoles(keycloakId, roles);
  } catch (error) {
    console.error('Error checking user roles:', error);
    return false;
  }
}

/**
 * Refresh user roles from Spring Database
 */
export async function refreshUserRoles(keycloakId: string): Promise<void> {
  try {
    await springRoleService.refreshUserRoles(keycloakId);
  } catch (error) {
    console.error('Error refreshing user roles:', error);
  }
}

/**
 * Clear user role cache
 */
export function clearUserRoleCache(keycloakId: string): void {
  springRoleService.clearUserCache(keycloakId);
}

/**
 * Get user data with roles and groups
 */
export async function getUserData(keycloakId: string) {
  try {
    return await springRoleService.fetchUserRoles(keycloakId);
  } catch (error) {
    console.error('Error getting user data:', error);
    return null;
  }
}
