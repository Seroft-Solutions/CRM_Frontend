/**
 * Account Cache Management Utilities
 * 
 * Provides utilities for managing account data cache lifecycle,
 * including invalidation, prefetching, and synchronization.
 */

import { QueryClient } from '@tanstack/react-query';
import { accountQueryKeys } from './account-keys';

/**
 * Invalidates all account-related queries
 * Use this when account data might have changed (e.g., after profile update)
 */
export function invalidateAccountCache(queryClient: QueryClient) {
  return queryClient.invalidateQueries({ 
    queryKey: accountQueryKeys.all,
    refetchType: 'active' // Only refetch active queries
  });
}

/**
 * Removes all account data from cache
 * Use this on logout or when switching users
 */
export function clearAccountCache(queryClient: QueryClient) {
  return queryClient.removeQueries({ 
    queryKey: accountQueryKeys.all 
  });
}

/**
 * Prefetches account data
 * Use this to warm up the cache before the user navigates to pages that need account data
 */
export function prefetchAccountData(queryClient: QueryClient) {
  // This would need to be implemented when we have the actual query function
  // For now, we just ensure the cache is properly set up
  return Promise.resolve();
}

/**
 * Forces a fresh fetch of account data
 * Use this when you need to ensure data is completely up-to-date
 */
export function refetchAccountData(queryClient: QueryClient) {
  return queryClient.refetchQueries({ 
    queryKey: accountQueryKeys.all,
    type: 'active'
  });
}

/**
 * Sets default data for account queries
 * Use this to populate cache with initial data
 */
export function setAccountCacheData(queryClient: QueryClient, data: any) {
  queryClient.setQueryData(accountQueryKeys.details(), data);
}
