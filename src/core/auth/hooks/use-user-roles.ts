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
 * - Integrated with React Query for caching and loading states
 * 
 * @returns {Object} Object containing roles array, loading state, and hasRole helper
 */

'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useGetAccount } from '@/core/api/generated/spring/endpoints/account-resource/account-resource.gen';
import { normalizeRole } from '../utils';

export function useUserRoles() {
  const { data: session, status } = useSession();
  const [roles, setRoles] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Use the generated API hook to fetch account data
  const { 
    data: accountData, 
    isLoading: accountLoading, 
    error: accountError 
  } = useGetAccount({
    query: {
      enabled: !!session?.user, // Only fetch when user is authenticated
    }
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
        // Normalize the roles from authorities
        const userRoles = accountData.authorities.map(normalizeRole);
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
