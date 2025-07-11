/**
 * Enhanced Account Hook with Optimized Caching
 * 
 * This hook provides a wrapper around the generated useGetAccount hook with:
 * - Optimized caching strategy for critical user data
 * - Background refetching to keep data fresh
 * - Better error handling and retry logic
 * - Automatic session validation
 * 
 * Features:
 * - 5 minute stale time (data stays fresh longer)
 * - Background refetch every 10 minutes
 * - Aggressive retry strategy for critical user data
 * - Automatic cache invalidation on auth changes
 * 
 * @returns Enhanced query result with account data
 */

'use client';

import { useSession } from 'next-auth/react';
import { useGetAccount } from '@/core/api/generated/spring/endpoints/account-resource/account-resource.gen';
import type { UseQueryResult } from '@tanstack/react-query';
import type { AdminUserDTO } from '@/core/api/generated/spring/schemas';

interface UseAccountOptions {
  /**
   * Whether to enable background refetching
   * @default true
   */
  refetchInBackground?: boolean;
  
  /**
   * Custom stale time in milliseconds
   * @default 5 minutes
   */
  staleTime?: number;
  
  /**
   * Whether to refetch on window focus
   * @default true
   */
  refetchOnWindowFocus?: boolean;
}

export function useAccount(options: UseAccountOptions = {}): UseQueryResult<AdminUserDTO, unknown> & {
  user: {
    name: string;
    email: string;
    image: string;
    initials: string;
    role: string | null;
    authorities: string[];
    activated: boolean | undefined;
    login: string | undefined;
  } | null;
} {
  const { data: session, status } = useSession();
  
  const {
    refetchInBackground = true,
    staleTime = 3 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus = true,
  } = options;

  const queryResult = useGetAccount({
    query: {
      enabled: status === 'authenticated' && !!session?.user,
      staleTime,
      gcTime: 10 * 60 * 1000, // 10 minutes garbage collection
      refetchOnWindowFocus,
      refetchOnReconnect: true,
      refetchInterval: refetchInBackground ? 10 * 60 * 1000 : false, // Refetch every 10 minutes in background
      retry: (failureCount, error: any) => {
        // Be more aggressive with retries for account data since it's critical
        if (error?.status === 401 || error?.status === 403) {
          return false; // Don't retry auth errors
        }
        return failureCount < 5; // Retry up to 5 times for other errors
      },
      retryDelay: (attemptIndex) => {
        // Faster initial retries for critical account data
        return Math.min(500 * 2 ** attemptIndex, 10000);
      },
    },
  });

  // Helper functions for user data
  const getInitials = (name: string) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const getFullName = () => {
    if (queryResult.data?.firstName && queryResult.data?.lastName) {
      return `${queryResult.data.firstName} ${queryResult.data.lastName}`;
    }
    return session?.user?.name || 'User';
  };

  const getEmail = () => {
    return queryResult.data?.email || session?.user?.email || '';
  };

  const getImageUrl = () => {
    return queryResult.data?.imageUrl || session?.user?.image || '';
  };

  const getPrimaryRole = () => {
    if (queryResult.data?.authorities && queryResult.data.authorities.length > 0) {
      // Remove 'ROLE_' prefix if present and lowercase
      return queryResult.data.authorities[0].replace('ROLE_', '').toLowerCase();
    }
    return null;
  };

  // Create user object with all necessary data
  const user = status === 'authenticated' && queryResult.data ? {
    name: getFullName(),
    email: getEmail(),
    image: getImageUrl(),
    initials: getInitials(getFullName()),
    role: getPrimaryRole(),
    authorities: queryResult.data?.authorities || [],
    activated: queryResult.data?.activated,
    login: queryResult.data?.login,
  } : null;

  return {
    ...queryResult,
    user,
  };
}
