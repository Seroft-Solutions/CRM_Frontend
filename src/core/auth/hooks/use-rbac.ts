/**
 * RBAC (Role-Based Access Control) Hook
 * Unified hook for role and permission checking
 */

'use client';

import { useUserAuthorities } from './use-user-authorities';
import { normalizeAuthority } from '../utils';

export function useRBAC() {
  const {
    roles,
    groups,
    authorities,
    isLoading,
    hasRole,
    hasGroup,
    hasAuthority,
    hasAnyRole,
    hasAnyGroup,
    hasAnyAuthority,
  } = useUserAuthorities();

  return {
    // Data
    roles,
    groups,
    authorities,
    isLoading,
    
    // Single checks
    hasRole,
    hasGroup,
    hasAuthority,
    hasPermission: hasAuthority, // Alias for consistency
    
    // Multiple checks
    hasAnyRole,
    hasAnyGroup,
    hasAnyAuthority,
    hasAnyPermission: hasAnyAuthority, // Alias for consistency
    
    // Convenience methods
    hasAllRoles: (rolesToCheck: string[]) => 
      rolesToCheck.every(role => hasRole(role)),
    hasAllGroups: (groupsToCheck: string[]) => 
      groupsToCheck.every(group => hasGroup(group)),
    hasAllAuthorities: (authoritiesToCheck: string[]) => 
      authoritiesToCheck.every(auth => hasAuthority(auth)),
    
    // Admin checks
    isAdmin: () => hasAnyRole(['ADMIN', 'SUPER_ADMIN', 'SYSTEM_ADMIN']),
    isSuperAdmin: () => hasRole('SUPER_ADMIN'),
    
    // Utility
    normalizeAuthority,
  };
}