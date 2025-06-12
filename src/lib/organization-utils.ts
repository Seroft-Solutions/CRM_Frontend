import type { UserOrganization } from '@/services/organization/organization-api.service';
import { Session } from 'next-auth';

/**
 * Utility functions for organization checks using API data
 */

/**
 * Check if user has existing organizations
 */
export function hasOrganizations(organizations: UserOrganization[] | undefined): boolean {
  return !!(organizations?.length);
}

/**
 * Legacy session-based function (deprecated - use API-based functions)
 */
export function hasOrganization(session: Session | null): boolean {
  // For backward compatibility during migration
  console.warn('hasOrganization(session) is deprecated - use hasOrganizations(organizations) with API data');
  return false; // Always return false to force API-based checks
}

/**
 * Get user's primary organization (first one)
 */
export function getPrimaryOrganization(organizations: UserOrganization[] | undefined): UserOrganization | null {
  return organizations?.[0] || null;
}

/**
 * Check if organization setup is needed
 */
export function isOrganizationSetupNeeded(organizations: UserOrganization[] | undefined): boolean {
  return !hasOrganizations(organizations);
}

/**
 * Get organization by ID
 */
export function getOrganizationById(organizations: UserOrganization[] | undefined, id: string): UserOrganization | null {
  return organizations?.find(org => org.id === id) || null;
}

/**
 * Get organization by name
 */
export function getOrganizationByName(organizations: UserOrganization[] | undefined, name: string): UserOrganization | null {
  return organizations?.find(org => org.name === name) || null;
}
