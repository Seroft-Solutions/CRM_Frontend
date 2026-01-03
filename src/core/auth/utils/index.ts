/**
 * Authentication utility functions
 * Centralized location for all auth-related utility functions
 */

import { signOut } from 'next-auth/react';
import type { KeycloakTokenPayload } from '../types';

export { logoutAction } from './actions';

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
    const { setLogoutInProgress } = await import('@/lib/auth-cleanup');
    setLogoutInProgress(true);

    await signOut({
      callbackUrl: '/',
      redirect: true,
    });
  } catch (error) {
    console.error('Logout error:', error);

    try {
      const { setLogoutInProgress } = await import('@/lib/auth-cleanup');
      setLogoutInProgress(true);
    } catch (e) {
      console.error('Failed to set logout flag:', e);
    }

    window.location.href = '/';
  }
}

// Prevent double logout calls
let isLoggingOut = false;

/**
 * Enhanced logout function that cleans up all auth storage before logging out
 * Use this function when you need to ensure proper cleanup of tenant context,
 * cookies, localStorage, and sessionStorage
 */
export async function logoutWithCleanup() {
  if (isLoggingOut) {
    console.log('[Logout] Already logging out, skipping duplicate call');
    return;
  }

  try {
    isLoggingOut = true;
    console.log('[Logout] Starting logout with cleanup');
    const { clearAuthStorage, setLogoutInProgress } = await import('@/lib/auth-cleanup');

    // CRITICAL: Set flag BEFORE any other operations
    console.log('[Logout] Setting logout flag');
    setLogoutInProgress(true);

    console.log('[Logout] Clearing auth storage');
    clearAuthStorage();

    // Small delay to ensure flag propagates
    await new Promise(resolve => setTimeout(resolve, 100));

    console.log('[Logout] Calling NextAuth signOut');
    await signOut({
      callbackUrl: '/',
      redirect: true,
    });
  } catch (error) {
    console.error('[Logout] Logout with cleanup error:', error);

    try {
      const { clearAuthStorage, setLogoutInProgress } = await import('@/lib/auth-cleanup');
      setLogoutInProgress(true);
      clearAuthStorage();
    } catch (cleanupError) {
      console.error('[Logout] Failed to cleanup storage on error:', cleanupError);
    }

    console.log('[Logout] Forcing redirect to /');
    window.location.href = '/';
  } finally {
    // Reset flag after a delay to allow for page navigation
    setTimeout(() => {
      isLoggingOut = false;
    }, 1000);
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
        if (session?.error) {
          return null;
        }
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
