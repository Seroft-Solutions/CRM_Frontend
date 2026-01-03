/**
 * Authentication Cleanup Utilities
 * Handles cleanup of all auth-related storage (cookies, localStorage, sessionStorage)
 */

/**
 * Clear all authentication-related storage WITHOUT setting logout flag
 * Use this for session expiry re-authentication, not for manual logout
 */
export function clearAuthStorageOnly() {
  const keysToRemove = [
    'selectedOrganizationId',
    'selectedOrganizationName',
    'userAuthorities',
    'userRoles',
    'userGroups',
    'access_token',
  ];

  keysToRemove.forEach((key) => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Failed to remove localStorage key: ${key}`, error);
    }
  });

  try {
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('draft_') || key.startsWith('formDraft_')) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.error('Failed to clear draft items from localStorage', error);
  }

  // Clear sessionStorage but preserve logout flag if it exists
  try {
    const logoutFlag = sessionStorage.getItem('LOGOUT_IN_PROGRESS');
    const logoutTimestamp = sessionStorage.getItem('LOGOUT_TIMESTAMP');

    sessionStorage.clear();

    // Restore logout flag if it was set
    if (logoutFlag) {
      sessionStorage.setItem('LOGOUT_IN_PROGRESS', logoutFlag);
    }
    if (logoutTimestamp) {
      sessionStorage.setItem('LOGOUT_TIMESTAMP', logoutTimestamp);
    }
  } catch (error) {
    console.error('Failed to clear sessionStorage', error);
  }

  // Only clear OUR cookies, NOT NextAuth cookies
  // NextAuth's signOut() will handle clearing its own cookies (session, csrf, etc.)
  const cookiesToClear = [
    'selectedOrganizationId',
    'selectedOrganizationName',
  ];

  cookiesToClear.forEach((cookieName) => {
    try {
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`;
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${window.location.hostname};`;
    } catch (error) {
      console.error(`Failed to clear cookie: ${cookieName}`, error);
    }
  });

  console.log('Auth storage cleared successfully');
}

/**
 * Clear all authentication-related storage
 * Use this for manual logout (but call setLogoutInProgress first!)
 * This includes:
 * - Cookies (organization cookies only, NOT NextAuth cookies)
 * - LocalStorage (organization data, drafts, cached data)
 * - SessionStorage (temporary data, but preserves logout flag)
 */
export function clearAuthStorage() {
  clearAuthStorageOnly();
}

/**
 * Set logout in progress flag
 * Uses both sessionStorage and cookie for redundancy
 */
export function setLogoutInProgress(value: boolean) {
  if (typeof window === 'undefined') return;

  try {
    if (value) {
      sessionStorage.setItem('LOGOUT_IN_PROGRESS', 'true');
      sessionStorage.setItem('LOGOUT_TIMESTAMP', Date.now().toString());
      document.cookie = 'LOGOUT_IN_PROGRESS=true; path=/; max-age=5; SameSite=Lax';
    } else {
      sessionStorage.removeItem('LOGOUT_IN_PROGRESS');
      sessionStorage.removeItem('LOGOUT_TIMESTAMP');
      document.cookie = 'LOGOUT_IN_PROGRESS=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    }
  } catch (error) {
    console.error('Failed to set logout flag:', error);
  }
}

/**
 * Check if logout is in progress
 * Auto-expires after 5 seconds to prevent stuck states
 */
export function isLogoutInProgress(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const flag = sessionStorage.getItem('LOGOUT_IN_PROGRESS');
    const timestamp = sessionStorage.getItem('LOGOUT_TIMESTAMP');

    if (!flag || !timestamp) return false;

    const elapsed = Date.now() - parseInt(timestamp, 10);
    if (elapsed > 5000) {
      setLogoutInProgress(false);
      return false;
    }

    return flag === 'true';
  } catch (error) {
    return false;
  }
}

/**
 * Clear only organization-related storage
 * Useful when switching organizations without full logout
 */
export function clearOrganizationStorage() {
  try {
    localStorage.removeItem('selectedOrganizationId');
    localStorage.removeItem('selectedOrganizationName');
  } catch (error) {
    console.error('Failed to clear organization from localStorage', error);
  }

  const orgCookies = ['selectedOrganizationId', 'selectedOrganizationName'];
  orgCookies.forEach((cookieName) => {
    try {
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    } catch (error) {
      console.error(`Failed to clear organization cookie: ${cookieName}`, error);
    }
  });

  console.log('Organization storage cleared successfully');
}

/**
 * Check if there's stale auth data that should be cleaned up
 * Returns true if cleanup is needed
 */
export function hasStaleAuthData(): boolean {
  try {
    const hasOrgInStorage =
      !!localStorage.getItem('selectedOrganizationId') ||
      document.cookie.includes('selectedOrganizationId');

    return hasOrgInStorage;
  } catch (error) {
    console.error('Failed to check for stale auth data', error);
    return false;
  }
}
