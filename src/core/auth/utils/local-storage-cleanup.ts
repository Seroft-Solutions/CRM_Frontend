/**
 * Local Storage Cleanup Utilities
 * Manages cleanup of tenant/organization data and session data during logout and organization switching
 */

/**
 * Organization/tenant-related localStorage keys that need cleanup
 */
const ORGANIZATION_KEYS = ['selectedOrganizationId', 'selectedOrganizationName'] as const;

/**
 * Authentication-related keys that need cleanup
 */
const AUTH_KEYS = ['access_token'] as const;

/**
 * Form and entity-related keys that should be cleared on logout
 */
const FORM_KEYS = [
  'crossFormNavigation',
  'createdEntityInfo',
  'entityCreationContext',
  'referrerInfo',
  'returnUrl',
  'relationshipFieldInfo',
] as const;

/**
 * Debug and development keys
 */
const DEBUG_KEYS = ['debug_logs'] as const;

/**
 * Gets all localStorage keys that start with a given prefix
 */
function getKeysByPrefix(prefix: string): string[] {
  if (typeof window === 'undefined') return [];

  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(prefix)) {
      keys.push(key);
    }
  }
  return keys;
}

/**
 * Cleans up all organization/tenant-related data from localStorage
 * Use this when switching organizations or during logout
 */
export function cleanupOrganizationData(): void {
  if (typeof window === 'undefined') return;

  console.log('Cleaning up organization data from localStorage');

  ORGANIZATION_KEYS.forEach((key) => {
    localStorage.removeItem(key);
    console.log(`Removed localStorage key: ${key}`);
  });
}

/**
 * Cleans up authentication tokens from both localStorage and sessionStorage
 */
export function cleanupAuthTokens(): void {
  if (typeof window === 'undefined') return;

  console.log('Cleaning up auth tokens from storage');

  AUTH_KEYS.forEach((key) => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
    console.log(`Removed storage key: ${key}`);
  });
}

/**
 * Cleans up form-related data and drafts
 * Use this during logout to clear any pending form data
 */
export function cleanupFormData(): void {
  if (typeof window === 'undefined') return;

  console.log('Cleaning up form data from localStorage');

  FORM_KEYS.forEach((key) => {
    localStorage.removeItem(key);
    console.log(`Removed localStorage key: ${key}`);
  });

  const formDraftKeys = getKeysByPrefix('draft_');
  const userProfileDraftKeys = getKeysByPrefix('userprofiles_draft_');
  const roleDraftKeys = getKeysByPrefix('roles_draft_');
  const userDraftKeys = getKeysByPrefix('userdrafts_draft_');

  [...formDraftKeys, ...userProfileDraftKeys, ...roleDraftKeys, ...userDraftKeys].forEach((key) => {
    localStorage.removeItem(key);
    console.log(`Removed localStorage draft key: ${key}`);
  });

  const crossEntityKeys = getKeysByPrefix('cross_entity_');
  crossEntityKeys.forEach((key) => {
    localStorage.removeItem(key);
    console.log(`Removed localStorage cross-entity key: ${key}`);
  });
}

/**
 * Cleans up column visibility preferences for tables
 * Optional cleanup - you may want to preserve user preferences
 */
export function cleanupTablePreferences(): void {
  if (typeof window === 'undefined') return;

  console.log('Cleaning up table preferences from localStorage');

  const columnVisibilityKeys = getKeysByPrefix('columnVisibility_');
  columnVisibilityKeys.forEach((key) => {
    localStorage.removeItem(key);
    console.log(`Removed localStorage column visibility key: ${key}`);
  });
}

/**
 * Cleans up debug logs (optional, usually only in development)
 */
export function cleanupDebugData(): void {
  if (typeof window === 'undefined') return;

  console.log('Cleaning up debug data from localStorage');

  DEBUG_KEYS.forEach((key) => {
    localStorage.removeItem(key);
    console.log(`Removed localStorage debug key: ${key}`);
  });
}

/**
 * Complete logout cleanup - removes all organization, auth, and form data
 * Use this when user logs out completely
 */
export function cleanupOnLogout(): void {
  if (typeof window === 'undefined') return;

  console.log('Performing complete logout cleanup');

  cleanupOrganizationData();
  cleanupAuthTokens();
  cleanupFormData();

  if (process.env.NODE_ENV === 'development') {
    cleanupDebugData();
  }

  console.log('Logout cleanup completed');
}

/**
 * Organization switch cleanup - removes organization data but preserves other session data
 * Use this when switching between organizations
 */
export function cleanupOnOrganizationSwitch(): void {
  if (typeof window === 'undefined') return;

  console.log('Performing organization switch cleanup');

  cleanupOrganizationData();
  cleanupFormData();

  console.log('Organization switch cleanup completed');
}

/**
 * Selective cleanup for specific use cases
 */
export const localStorageCleanup = {
  organization: cleanupOrganizationData,
  auth: cleanupAuthTokens,
  forms: cleanupFormData,
  tables: cleanupTablePreferences,
  debug: cleanupDebugData,

  logout: cleanupOnLogout,
  organizationSwitch: cleanupOnOrganizationSwitch,

  getKeysByPrefix,

  keys: {
    organization: ORGANIZATION_KEYS,
    auth: AUTH_KEYS,
    forms: FORM_KEYS,
    debug: DEBUG_KEYS,
  },
};
