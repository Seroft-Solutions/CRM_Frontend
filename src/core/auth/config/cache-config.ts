/**
 * Centralized Auth Cache Configuration
 * Consistent caching strategy across all auth hooks
 */

export const AUTH_CACHE_CONFIG = {
  // Account data caching
  account: {
    staleTime: 10 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchInterval: 10 * 60 * 1000, // Background refetch every 10 minutes
  },
  
  // Authorities/roles caching
  authorities: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchInterval: 15 * 60 * 1000, // Background refetch every 15 minutes (less frequent)
  },
  
  // Session monitoring
  session: {
    checkInterval: 60 * 1000, // Check every minute
    warningThreshold: 2, // Warn 2 minutes before expiry
    gracePeriod: 3, // Wait 3 minutes after login
    idleTimeout: 5, // 5 minutes of inactivity
  },
  
  // Activity tracking
  activity: {
    timeout: 5 * 60 * 1000, // 5 minutes idle timeout
    events: ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'],
  },
  
  // Retry configuration
  retry: {
    maxAttempts: 3,
    baseDelay: 1000, // 1 second
    maxDelay: 10000, // 10 seconds
  },
} as const;