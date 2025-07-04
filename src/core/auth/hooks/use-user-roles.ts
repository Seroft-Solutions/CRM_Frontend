/**
 * Hook to fetch user roles dynamically
 * This avoids storing roles in session to prevent size limits
 * Fetches roles from the backend API instead of parsing from JWT
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
        console.log('🔧 [useUserRoles] Fetched authorities from API:', {
          rawAuthorities: accountData.authorities,
          normalizedRoles: userRoles
        });
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
