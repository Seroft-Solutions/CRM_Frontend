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
import { AUTH_CACHE_CONFIG } from '@/core/auth/config/cache-config';
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

export function useAccount(options: UseAccountOptions = {}): UseQueryResult<
  AdminUserDTO,
  unknown
> & {
  user: {
    name: string;
    email: string;
    image: string;
    initials: string;
    role: string | null;
    authorities: string[]; // Normalized authorities (without ROLE_/GROUP_ prefixes)
    rawAuthorities: string[]; // Original authorities with prefixes
    activated: boolean | undefined;
    login: string | undefined;
  } | null;
} {
  const { data: session, status } = useSession();

  const {
    refetchInBackground = true,
    staleTime = AUTH_CACHE_CONFIG.account.staleTime,
    refetchOnWindowFocus = true,
  } = options;

  const queryResult = useGetAccount({
    query: {
      enabled: status === 'authenticated' && !!session?.user,
      staleTime,
      gcTime: AUTH_CACHE_CONFIG.account.gcTime,
      refetchOnWindowFocus,
      refetchOnReconnect: true,
      refetchInterval: refetchInBackground ? AUTH_CACHE_CONFIG.account.refetchInterval : false,
      retry: (failureCount, error: any) => {
        // Don't retry auth errors
        if (error?.status === 401 || error?.status === 403) {
          return false;
        }
        return failureCount < AUTH_CACHE_CONFIG.retry.maxAttempts;
      },
      retryDelay: (attemptIndex) => {
        return Math.min(
          AUTH_CACHE_CONFIG.retry.baseDelay * 2 ** attemptIndex,
          AUTH_CACHE_CONFIG.retry.maxDelay
        );
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
      // Find the first role (starts with ROLE_) and normalize it
      const firstRole = queryResult.data.authorities.find((auth) => auth.startsWith('ROLE_'));
      if (firstRole) {
        return firstRole.replace('ROLE_', '').toLowerCase();
      }
      // Fallback: use first authority and normalize it
      return queryResult.data.authorities[0].replace(/^(ROLE_|GROUP_)/, '').toLowerCase();
    }
    return null;
  };

  const getNormalizedAuthorities = () => {
    if (queryResult.data?.authorities) {
      return queryResult.data.authorities.map((auth) => {
        if (auth.startsWith('ROLE_')) {
          return auth.replace('ROLE_', '');
        }
        if (auth.startsWith('GROUP_')) {
          return auth.replace('GROUP_', '');
        }
        return auth;
      });
    }
    return [];
  };

  // Create user object with all necessary data
  const user =
    status === 'authenticated' && queryResult.data
      ? {
          name: getFullName(),
          email: getEmail(),
          image: getImageUrl(),
          initials: getInitials(getFullName()),
          role: getPrimaryRole(),
          authorities: getNormalizedAuthorities(), // Now includes normalized roles and groups
          rawAuthorities: queryResult.data?.authorities || [], // Keep original authorities for debugging
          activated: queryResult.data?.activated,
          login: queryResult.data?.login,
        }
      : null;

  return {
    ...queryResult,
    user,
  };
}
