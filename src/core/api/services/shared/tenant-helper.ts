/**
 * Centralized tenant header utilities for API services
 * Handles tenant context for client-side API calls
 */

const formatTenantHeader = (orgName: string): string => {
  return orgName.toLowerCase().replace(/[^a-z0-9]/g, '_');
};

export const getTenantHeader = (): string | undefined => {
  if (typeof window === 'undefined') return undefined;

  const selectedOrgName = localStorage.getItem('selectedOrganizationName');
  if (!selectedOrgName) return undefined;

  return formatTenantHeader(selectedOrgName);
};

export const getSelectedOrganizationName = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('selectedOrganizationName');
};

export const getSelectedOrganizationId = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('selectedOrganizationId');
};

export const hasTenantContext = (): boolean => {
  return !!getTenantHeader();
};
