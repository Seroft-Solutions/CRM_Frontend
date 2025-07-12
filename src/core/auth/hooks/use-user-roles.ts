/**
 * Hook to fetch user roles dynamically from backend API
 * 
 * This hook replaces the previous approach of storing roles in the NextAuth session,
 * which had size limitations (4KB max). Instead, it fetches user authorities from
 * the backend /api/account endpoint and normalizes them for permission checking.
 * 
 * Features:
 * - Fetches roles from backend API instead of JWT token parsing
 * - Handles 500+ roles without session size issues
 * - Automatic role normalization (removes ROLE_ prefix)
 * - Integrated with enhanced caching and error handling
 * - Background refetching to keep roles in sync
 * 
 * @deprecated Consider using useUserAuthorities for both roles and groups
 * @returns {Object} Object containing roles array, loading state, and hasRole helper
 */

'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useAccount } from "@/core/auth/hooks/use-account";
import { normalizeRole, normalizeAuthority } from "@/core/auth/utils";

export function useUserRoles() {
  const { data: session, status } = useSession();
  const [roles, setRoles] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Use the enhanced account hook with optimized caching
  const { 
    data: accountData, 
    isLoading: accountLoading, 
    error: accountError 
  } = useAccount({
    refetchInBackground: true, // Keep roles fresh in background
    staleTime: 5 * 60 * 1000, // 5 minutes stale time for role data
  });

  useEffect(() => {
    if (status === 'loading' || accountLoading) {
      setIsLoading(true);
      return;
    }

    if (!session?.user || accountError) {
      setRoles([]);
      setIsLoading(false);
      return;
    }

    if (accountData?.authorities) {
      try {
        // Filter and normalize only role authorities
        const userRoles = accountData.authorities
          .filter((authority: string) => authority.startsWith('ROLE_') || !authority.startsWith('GROUP_'))
          .map((authority: string) => normalizeAuthority(authority));
        setRoles(userRoles);
      } catch (error) {
        console.error('Failed to process user authorities:', error);
        setRoles([]);
      }
    } else {
      setRoles([]);
    }
    
    setIsLoading(false);
  }, [session, status, accountData, accountLoading, accountError]);

  return {
    roles,
    isLoading,
    hasRole: (role: string) => roles.includes(normalizeRole(role)),
  };
}
