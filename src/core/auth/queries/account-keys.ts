/**
 * Account Query Keys Factory
 *
 * Centralized query key management for account-related queries.
 * This ensures consistent caching and invalidation across the application.
 *
 * Features:
 * - Standardized query key structure
 * - Easy cache invalidation
 * - Type-safe query key generation
 * - Hierarchical key organization
 */

export const accountQueryKeys = {
  /**
   * Base key for all account-related queries
   */
  all: ['account'] as const,

  /**
   * Key for the main account details query
   */
  details: () => [...accountQueryKeys.all, 'details'] as const,

  /**
   * Key for account roles/authorities query
   */
  roles: () => [...accountQueryKeys.all, 'roles'] as const,

  /**
   * Key for account profile data
   */
  profile: () => [...accountQueryKeys.all, 'profile'] as const,

  /**
   * Key for account permissions
   */
  permissions: () => [...accountQueryKeys.all, 'permissions'] as const,
} as const;

/**
 * Helper to invalidate all account-related queries
 * Usage: queryClient.invalidateQueries({ queryKey: accountQueryKeys.all })
 */
export const invalidateAccountQueries = accountQueryKeys.all;

/**
 * Helper to remove all account-related queries from cache
 * Usage: queryClient.removeQueries({ queryKey: accountQueryKeys.all })
 */
export const removeAccountQueries = accountQueryKeys.all;
