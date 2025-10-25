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
  // Clear localStorage
  const keysToRemove = [
    'selectedOrganizationId',
    'selectedOrganizationName',
    'userAuthorities',
    'userRoles',
    'userGroups',
  ];

  keysToRemove.forEach((key) => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Failed to remove localStorage key: ${key}`, error);
    }
  });

  // Clear all draft-related localStorage items
  try {
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('draft_') || key.startsWith('formDraft_')) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.error('Failed to clear draft items from localStorage', error);
  }

  // Clear sessionStorage
  try {
    sessionStorage.clear();
  } catch (error) {
    console.error('Failed to clear sessionStorage', error);
  }

  // Clear cookies
  const cookiesToClear = [
    'selectedOrganizationId',
    'selectedOrganizationName',
    'authjs.session-token',
    'authjs.csrf-token',
    'authjs.callback-url',
    '__Secure-authjs.session-token',
    '__Host-authjs.csrf-token',
  ];

  cookiesToClear.forEach((cookieName) => {
    try {
      // Clear with different path variations to ensure removal
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
 * Clear only organization-related storage
 * Useful when switching organizations without full logout
 */
export function clearOrganizationStorage() {
  // Clear organization from localStorage
  try {
    localStorage.removeItem('selectedOrganizationId');
    localStorage.removeItem('selectedOrganizationName');
  } catch (error) {
    console.error('Failed to clear organization from localStorage', error);
  }

  // Clear organization cookies
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
    // Check for organization data in storage
    const hasOrgInStorage =
      !!localStorage.getItem('selectedOrganizationId') ||
      document.cookie.includes('selectedOrganizationId');

    return hasOrgInStorage;
  } catch (error) {
    console.error('Failed to check for stale auth data', error);
    return false;
  }
}
