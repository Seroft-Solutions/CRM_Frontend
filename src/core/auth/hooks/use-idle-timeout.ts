/**
 * Idle Timeout Hook
 * Custom hook for accessing idle timeout functionality
 */

'use client';

import { useSessionManager } from '@/core/auth/providers/session-manager';

export function useIdleTimeout() {
  const { isIdle, minutesIdle, resetIdleTimer, isAuthenticated } = useSessionManager();

  return {
    isIdle,
    minutesIdle,
    resetIdleTimer,
    isAuthenticated,
    /**
     * Get a human-readable status of the user's activity
     */
    getActivityStatus: () => {
      if (minutesIdle === 0) return 'Active';
      if (minutesIdle < 5) return 'Recently Active';
      if (minutesIdle < 8) return 'Idle';
      return 'Inactive';
    },
    /**
     * Get the time remaining before logout warning
     */
    getTimeUntilWarning: (timeoutMinutes: number = 10, warningMinutes: number = 2) => {
      const warningThreshold = timeoutMinutes - warningMinutes;
      const remaining = warningThreshold - minutesIdle;
      return Math.max(0, remaining);
    },
    /**
     * Get the time remaining before automatic logout
     */
    getTimeUntilLogout: (timeoutMinutes: number = 10) => {
      const remaining = timeoutMinutes - minutesIdle;
      return Math.max(0, remaining);
    },
  };
}
