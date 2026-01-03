/**
 * Authentication Cleanup Utilities
 * Handles cleanup of all auth-related storage (cookies, localStorage, sessionStorage)
 */

/**
 * Clear all authentication-related storage
 * This includes:
 * - Cookies (organization, session, auth tokens)
 * - LocalStorage (organization data, drafts, cached data)
 * - SessionStorage (temporary auth data)
 */
export function clearAuthStorage() {
  // Set logout flag for middleware
  if (typeof document !== 'undefined') {
    document.cookie = 'LOGOUT_IN_PROGRESS=true; path=/; max-age=5; SameSite=Lax';
  }

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

  try {
    sessionStorage.clear();
  } catch (error) {
    console.error('Failed to clear sessionStorage', error);
  }

  const cookiesToClear = [
    'selectedOrganizationId',
    'selectedOrganizationName',
    'authjs.session-token',
    'authjs.csrf-token',
    'authjs.callback-url',
    'authjs.pkce.code_verifier',
    'authjs.state',
    'authjs.nonce',
    '__Secure-authjs.session-token',
    '__Host-authjs.csrf-token',
    '__Secure-authjs.callback-url',
    '__Host-authjs.callback-url',
    '__Secure-authjs.pkce.code_verifier',
    '__Host-authjs.pkce.code_verifier',
    '__Secure-authjs.state',
    '__Host-authjs.state',
    '__Secure-authjs.nonce',
    '__Host-authjs.nonce',
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
