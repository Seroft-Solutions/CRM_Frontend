/**
 * Authentication utility functions
 * Centralized location for all auth-related utility functions
 */

import { signOut } from 'next-auth/react';
import type { KeycloakTokenPayload } from '../types';

// Re-export server actions
export { logoutAction } from './actions';

// Re-export local storage cleanup utilities
export { localStorageCleanup } from './local-storage-cleanup';

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
 * Logout utility function that handles both NextAuth and Keycloak logout
 */
export async function logout() {
  try {
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
 * Enhanced logout function that cleans up local storage before logging out
 * Use this function when you need to ensure proper cleanup of tenant context
 */
export async function logoutWithCleanup() {
  try {
    // Import cleanup utility dynamically to avoid SSR issues
    const { localStorageCleanup } = await import('./local-storage-cleanup');

    // Clean up all local storage data
    localStorageCleanup.logout();

    // Proceed with normal logout
    await signOut({
      callbackUrl: '/',
      redirect: true,
    });
  } catch (error) {
    console.error('Logout with cleanup error:', error);
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
      const response = await fetch('/api/auth/session');
      if (response.ok) {
        const session = await response.json();
        return session?.access_token || null;
      }

      const { tokenStorage } = await import('../tokens');
      return tokenStorage.getToken() || tokenStorage.getTokenSession();
    }

    const { getAccessToken } = await import('@/lib/dal');
    return await getAccessToken();
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
