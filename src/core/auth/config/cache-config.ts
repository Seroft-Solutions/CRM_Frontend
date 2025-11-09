/**
 * Centralized Auth Cache Configuration
 * Consistent caching strategy across all auth hooks
 */

export const AUTH_CACHE_CONFIG = {
  account: {
    staleTime: 10 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
  },

  authorities: {
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchInterval: 15 * 60 * 1000,
  },

  session: {
    checkInterval: 60 * 1000,
    warningThreshold: 2,
    gracePeriod: 3,
    idleTimeout: 5,
  },

  activity: {
    timeout: 5 * 60 * 1000,
    events: ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'],
  },

  retry: {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 10000,
  },
} as const;
