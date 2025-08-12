/**
 * Hook to fetch user roles
 * Simplified wrapper around useUserAuthorities for backward compatibility
 */

'use client';

import { useUserAuthorities } from '@/core/auth/hooks/use-user-authorities';

export function useUserRoles() {
  const { roles, isLoading, hasRole } = useUserAuthorities();

  return {
    roles,
    isLoading,
    hasRole,
  };
}
