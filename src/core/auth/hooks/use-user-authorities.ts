/**
 * Hook to fetch user authorities (roles and groups) dynamically from backend API
 * 
 * This hook replaces the previous approach of storing roles in the NextAuth session,
 * which had size limitations (4KB max). Instead, it fetches user authorities from
 * the backend /api/account endpoint and normalizes them for permission checking.
 * 
 * Features:
 * - Fetches authorities from backend API instead of JWT token parsing
 * - Handles 500+ authorities without session size issues
 * - Automatic authority normalization (removes ROLE_ and GROUP_ prefixes)
 * - Integrated with enhanced caching and error handling
 * - Background refetching to keep authorities in sync
 * - Separates roles and groups for better organization
 * 
 * @returns {Object} Object containing roles, groups, loading state, and helper functions
 */

'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useAccount } from "@/core/auth/hooks/use-account";
import { AUTH_CACHE_CONFIG } from "@/core/auth/config/cache-config";
import { normalizeRole, normalizeGroup, normalizeAuthority } from "@/core/auth/utils";

export function useUserAuthorities() {
  const { data: session, status } = useSession();
  const [roles, setRoles] = useState<string[]>([]);
  const [groups, setGroups] = useState<string[]>([]);
  const [allAuthorities, setAllAuthorities] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Use the enhanced account hook with optimized caching
  const { 
    data: accountData, 
    isLoading: accountLoading, 
    error: accountError 
  } = useAccount({
    refetchInBackground: true, // Keep authorities fresh in background
    staleTime: AUTH_CACHE_CONFIG.authorities.staleTime,
  });

  useEffect(() => {
    if (status === 'loading' || accountLoading) {
      setIsLoading(true);
      return;
    }

    if (!session?.user || accountError) {
      setRoles([]);
      setGroups([]);
      setAllAuthorities([]);
      setIsLoading(false);
      return;
    }

    if (accountData?.authorities) {
      try {
        const userRoles: string[] = [];
        const userGroups: string[] = [];
        const normalizedAuthorities: string[] = [];

        accountData.authorities.forEach((authority: string) => {
          const normalized = normalizeAuthority(authority);
          normalizedAuthorities.push(normalized);

          if (authority.startsWith('ROLE_')) {
            userRoles.push(normalized);
          } else if (authority.startsWith('GROUP_')) {
            userGroups.push(normalized);
          } else {
            // Handle authorities without prefixes - assume they are roles for backward compatibility
            userRoles.push(normalized);
          }
        });

        setRoles(userRoles);
        setGroups(userGroups);
        setAllAuthorities(normalizedAuthorities);
      } catch (error) {
        console.error('Failed to process user authorities:', error);
        setRoles([]);
        setGroups([]);
        setAllAuthorities([]);
      }
    } else {
      setRoles([]);
      setGroups([]);
      setAllAuthorities([]);
    }
    
    setIsLoading(false);
  }, [session, status, accountData, accountLoading, accountError]);

  return {
    roles,
    groups,
    authorities: allAuthorities,
    isLoading,
    
    // Helper functions
    hasRole: (role: string) => roles.includes(normalizeRole(role)),
    hasGroup: (group: string) => groups.includes(normalizeGroup(group)),
    hasAuthority: (authority: string) => allAuthorities.includes(normalizeAuthority(authority)),
    hasAnyRole: (rolesToCheck: string[]) => rolesToCheck.some(role => roles.includes(normalizeRole(role))),
    hasAnyGroup: (groupsToCheck: string[]) => groupsToCheck.some(group => groups.includes(normalizeGroup(group))),
    hasAnyAuthority: (authoritiesToCheck: string[]) => authoritiesToCheck.some(auth => allAuthorities.includes(normalizeAuthority(auth))),
  };
}

// Backward compatibility export
export { useUserAuthorities as useUserRoles };
