/**
 * Centralized tenant header utilities for API services
 * Handles tenant context for client-side API calls
 */

// Helper to convert organization name to tenant header format
const formatTenantHeader = (orgName: string): string => {
  return orgName.toLowerCase().replace(/[^a-z0-9]/g, '_');
};

// Function to get tenant header from localStorage
export const getTenantHeader = (): string | undefined => {
  if (typeof window === 'undefined') return undefined;

  const selectedOrgName = localStorage.getItem('selectedOrganizationName');
  if (!selectedOrgName) return undefined;

  return formatTenantHeader(selectedOrgName);
};

// Function to get selected organization name safely
export const getSelectedOrganizationName = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('selectedOrganizationName');
};

// Function to get selected organization ID safely
export const getSelectedOrganizationId = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('selectedOrganizationId');
};

// Function to check if tenant context is available
export const hasTenantContext = (): boolean => {
  return !!getTenantHeader();
};