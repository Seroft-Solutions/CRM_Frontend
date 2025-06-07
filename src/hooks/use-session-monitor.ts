'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useCallback, useRef } from 'react';
import { useActivityTracker } from './use-activity-tracker';
import { refreshSession } from '@/lib/token-refresh';

interface SessionMonitorOptions {
  checkInterval?: number; // in milliseconds
  onSessionExpired?: () => void;
  onSessionRestored?: () => void;
  warningThreshold?: number; // minutes before expiry to show warning
  onSessionWarning?: (minutesLeft: number) => void;
  gracePeriod?: number; // minutes to wait after login before starting checks
  idleTimeout?: number; // minutes of inactivity before warnings can show
  autoRefreshOnActivity?: boolean; // auto-refresh session when user is active
}

export function useSessionMonitor(options: SessionMonitorOptions = {}) {
  const { data: session, status, update } = useSession();
  const {
    checkInterval = 60000, // Check every minute
    onSessionExpired,
    onSessionRestored,
    warningThreshold = 2, // Warn 2 minutes before expiry
    onSessionWarning,
    gracePeriod = 3, // Wait 3 minutes after login before starting checks
    idleTimeout = 3, // Only show warnings after 3 minutes of inactivity
    autoRefreshOnActivity = true, // Auto-refresh session when user is active
  } = options;

  const { isIdle, minutesIdle, resetActivity } = useActivityTracker({
    timeout: idleTimeout * 60 * 1000,
  });

  const lastSessionState = useRef<boolean>(false);
  const warningShown = useRef<boolean>(false);
  const lastTokenExpiry = useRef<number>(0);
  const debounceTimer = useRef<NodeJS.Timeout>();
  const loginTime = useRef<number>(0);

  const checkSessionValidity = useCallback(async () => {
    if (status === 'loading') return;

    const hasValidSession = !!session?.user;
    const hadSessionBefore = lastSessionState.current;

    // Track login time for grace period
    if (hasValidSession && !hadSessionBefore) {
      loginTime.current = Date.now();
    }

    // Check if we're still in grace period
    const timeSinceLogin = Date.now() - loginTime.current;
    const isInGracePeriod = timeSinceLogin < gracePeriod * 60 * 1000;

    if (isInGracePeriod && hasValidSession) {
      lastSessionState.current = hasValidSession;
      return;
    }

    // Session state changed
    if (hasValidSession !== hadSessionBefore) {
      if (!hasValidSession && hadSessionBefore) {
        onSessionExpired?.();
      } else if (hasValidSession && !hadSessionBefore) {
        warningShown.current = false;
        lastTokenExpiry.current = 0;
        onSessionRestored?.();
      }
    }

    // Check token expiry if we have a session
    if (hasValidSession && session?.access_token) {
      try {
        const tokenPayload = JSON.parse(atob(session.access_token.split('.')[1]));
        const expiryTime = tokenPayload.exp * 1000;
        const currentTime = Date.now();
        const timeUntilExpiry = expiryTime - currentTime;
        const minutesUntilExpiry = Math.floor(timeUntilExpiry / 60000);

        // Auto-refresh session if user is active and token is about to expire
        if (autoRefreshOnActivity && !isIdle && minutesUntilExpiry <= warningThreshold) {
          const refreshSuccess = await refreshSession();
          if (refreshSuccess) {
            return;
          } else {
            console.error('Auto-refresh failed, will show warning');
          }
        }

        // Reset warning if token has been refreshed
        if (lastTokenExpiry.current !== expiryTime) {
          warningShown.current = false;
          lastTokenExpiry.current = expiryTime;
        }

        // Only show warning if user is idle AND token is expiring
        if (
          isIdle &&
          warningThreshold > 0 &&
          minutesUntilExpiry <= warningThreshold &&
          minutesUntilExpiry > 0 &&
          !warningShown.current
        ) {
          if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
          }

          debounceTimer.current = setTimeout(() => {
            if (!warningShown.current && isIdle) {
              warningShown.current = true;
              onSessionWarning?.(minutesUntilExpiry);
            }
          }, 1000);
        }

        // Token has expired
        if (timeUntilExpiry <= 0) {
          onSessionExpired?.();
        }
      } catch (error) {
        console.error('Error parsing token for expiry check:', error);
      }
    }

    lastSessionState.current = hasValidSession;
  }, [
    session,
    status,
    onSessionExpired,
    onSessionRestored,
    onSessionWarning,
    warningThreshold,
    gracePeriod,
    isIdle,
    minutesIdle,
    autoRefreshOnActivity,
    update,
  ]);

  useEffect(() => {
    // Initial check
    checkSessionValidity();

    // Set up interval for periodic checks
    const interval = setInterval(checkSessionValidity, checkInterval);

    return () => {
      clearInterval(interval);
      // Clear debounce timer on cleanup
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [checkSessionValidity, checkInterval]);

  return {
    session,
    status,
    isAuthenticated: !!session?.user,
    isLoading: status === 'loading',
    isIdle,
    minutesIdle,
  };
}
