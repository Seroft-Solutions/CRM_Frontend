import { Session } from 'next-auth';

/**
 * Utility functions for organization checks
 * Can be used in both server and client components
 */

/**
 * Check if user has existing organization
 */
export function hasOrganization(session: Session | null): boolean {
  return !!(session?.user?.organizations?.length);
}

/**
 * Get user's primary organization
 */
export function getPrimaryOrganization(session: Session | null) {
  return session?.user?.organizations?.[0] || null;
}

/**
 * Check if organization setup is needed
 */
export function isOrganizationSetupNeeded(session: Session | null): boolean {
  return !hasOrganization(session);
}

/**
 * Check if user needs sync (has org in Keycloak but might need Spring sync)
 */
export function needsOrganizationSync(session: Session | null): boolean {
  // If user has organization in Keycloak, they might need sync
  return hasOrganization(session);
}
