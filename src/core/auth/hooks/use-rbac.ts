/**
 * RBAC (Role-Based Access Control) Hook
 * Unified hook for role and permission checking
 */

'use client';

import { useUserAuthorities } from '@/core/auth/hooks/use-user-authorities';
import { normalizeAuthority } from '@/core/auth/utils';

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
    roles,
    groups,
    authorities,
    isLoading,

    hasRole,
    hasGroup,
    hasAuthority,
    hasPermission: hasAuthority,

    hasAnyRole,
    hasAnyGroup,
    hasAnyAuthority,
    hasAnyPermission: hasAnyAuthority,

    hasAllRoles: (rolesToCheck: string[]) => rolesToCheck.every((role) => hasRole(role)),
    hasAllGroups: (groupsToCheck: string[]) => groupsToCheck.every((group) => hasGroup(group)),
    hasAllAuthorities: (authoritiesToCheck: string[]) =>
      authoritiesToCheck.every((auth) => hasAuthority(auth)),

    isAdmin: () => hasAnyRole(['ADMIN', 'SUPER_ADMIN', 'SYSTEM_ADMIN']),
    isSuperAdmin: () => hasRole('SUPER_ADMIN'),

    normalizeAuthority,
  };
}
