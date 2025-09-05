/**
 * Session Manager Provider
 * Session management with idle timeout feature
 */

'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
  useEffect,
  useRef,
} from 'react';
import { signOut, useSession } from 'next-auth/react';
import { SessionExpiredModal } from '@/core/auth/components/session-expired-modal';
import { useSessionEvents } from '@/core/auth/session/events';

interface SessionManagerContextType {
  showSessionExpiredModal: () => void;
  showSessionWarningModal: (minutesLeft: number) => void;
  hideSessionModal: () => void;
  refreshSession: () => Promise<boolean>;
  isAuthenticated: boolean;
  isLoading: boolean;
  resetIdleTimer: () => void;
  isIdle: boolean;
  minutesIdle: number;
}

const SessionManagerContext = createContext<SessionManagerContextType | undefined>(undefined);

interface SessionManagerProviderProps {
  children: ReactNode;
  idleTimeoutMinutes?: number; // Default to 10 minutes
  warningBeforeLogoutMinutes?: number; // Default to 2 minutes warning
}

export function SessionManagerProvider({
  children,
  idleTimeoutMinutes = 10,
  warningBeforeLogoutMinutes = 2,
}: SessionManagerProviderProps) {
  const { data: session, status } = useSession();
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    type: 'expired' | 'warning' | 'idle';
    minutesLeft?: number;
  }>({
    isOpen: false,
    type: 'expired',
  });

  const [isIdle, setIsIdle] = useState(false);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [minutesIdle, setMinutesIdle] = useState(0);

  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null);
  const logoutTimerRef = useRef<NodeJS.Timeout | null>(null);
  const activityCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Session events for handling API 401 errors
  const { onSessionExpired } = useSessionEvents();

  // Events to track for user activity
  const activityEvents = [
    'mousedown',
    'mousemove',
    'keypress',
    'scroll',
    'touchstart',
    'click',
    'keydown',
    'resize',
  ];

  const showSessionExpiredModal = useCallback(() => {
    setModalState({
      isOpen: true,
      type: 'expired',
    });
  }, []);

  const showSessionWarningModal = useCallback((minutesLeft: number) => {
    setModalState({
      isOpen: true,
      type: 'warning',
      minutesLeft,
    });
  }, []);

  const showIdleTimeoutModal = useCallback(() => {
    setModalState({
      isOpen: true,
      type: 'idle',
    });
  }, []);

  const hideSessionModal = useCallback(() => {
    // Only allow hiding if it's a warning modal, not expired or idle
    setModalState((prev) => {
      if (prev.type === 'warning') {
        return { isOpen: false, type: 'expired' };
      }
      return prev; // Don't hide expired or idle modals
    });
  }, []);

  const resetIdleTimer = useCallback(() => {
    const now = Date.now();
    setLastActivity(now);
    setIsIdle(false);
    setMinutesIdle(0);

    // Only hide the modal if it's a warning modal, not if it's expired or idle
    setModalState((prev) => {
      if (prev.isOpen && prev.type === 'warning') {
        return { isOpen: false, type: 'expired' };
      }
      return prev;
    });

    // Clear existing timers
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);

    // Set warning timer (8 minutes for 10-minute timeout with 2-minute warning)
    const warningTime = (idleTimeoutMinutes - warningBeforeLogoutMinutes) * 60 * 1000;
    warningTimerRef.current = setTimeout(() => {
      setIsIdle(true);
      showSessionWarningModal(warningBeforeLogoutMinutes);
    }, warningTime);

    // Set logout timer (full timeout duration)
    const logoutTime = idleTimeoutMinutes * 60 * 1000;
    logoutTimerRef.current = setTimeout(() => {
      showIdleTimeoutModal();
      // Don't force logout - just show modal and let user decide
    }, logoutTime);
  }, [
    idleTimeoutMinutes,
    warningBeforeLogoutMinutes,
    showSessionWarningModal,
    showIdleTimeoutModal,
  ]);

  const refreshSession = useCallback(async (): Promise<boolean> => {
    try {
      // Force a session refresh by calling NextAuth's session endpoint
      const response = await fetch('/api/auth/session', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const session = await response.json();
        if (session?.user && !session.error) {
          // Session is valid, reset activity and hide modal
          resetIdleTimer();
          hideSessionModal();
          
          // Trigger token refreshed event for API layer
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('token-refreshed'));
          }
          
          return true;
        }
      }
      
      // Session refresh failed
      console.error('Session refresh failed - invalid session');
      showSessionExpiredModal();
      return false;
    } catch (error) {
      console.error('Session refresh failed:', error);
      showSessionExpiredModal();
      return false;
    }
  }, [resetIdleTimer, hideSessionModal, showSessionExpiredModal]);

  const handleManualLogout = useCallback(async () => {
    try {
      await signOut({
        callbackUrl: '/',
        redirect: true,
      });
    } catch (error) {
      console.error('Logout failed:', error);
      // Fallback: force redirect
      window.location.href = '/';
    }
  }, []);


  const handleActivity = useCallback(() => {
    resetIdleTimer();
  }, [resetIdleTimer]);

  // Update minutes idle counter
  useEffect(() => {
    if (!activityCheckIntervalRef.current) {
      activityCheckIntervalRef.current = setInterval(() => {
        const now = Date.now();
        const minutesSinceActivity = Math.floor((now - lastActivity) / 60000);
        setMinutesIdle(minutesSinceActivity);
      }, 30000); // Update every 30 seconds
    }

    return () => {
      if (activityCheckIntervalRef.current) {
        clearInterval(activityCheckIntervalRef.current);
        activityCheckIntervalRef.current = null;
      }
    };
  }, [lastActivity]);

  // Monitor session for errors from NextAuth
  useEffect(() => {
    if (session?.error === 'RefreshAccessTokenError') {
      console.log('Session refresh error detected from NextAuth');
      // Only show modal if not already shown and not in a refresh loop
      if (!modalState.isOpen) {
        showSessionExpiredModal();
      }
    }
  }, [session?.error, showSessionExpiredModal, modalState.isOpen]);

  // Set up session event listener for API 401 errors
  useEffect(() => {
    const unsubscribe = onSessionExpired((event) => {
      console.log('Session expired from API call:', event.message);
      showSessionExpiredModal();
    });

    return unsubscribe;
  }, [onSessionExpired, showSessionExpiredModal]);

  // Set up activity listeners
  useEffect(() => {
    // Initialize timer
    resetIdleTimer();

    // Add event listeners for activity tracking
    activityEvents.forEach((event) => {
      document.addEventListener(event, handleActivity, true);
    });

    return () => {
      // Cleanup timers
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
      if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
      if (activityCheckIntervalRef.current) clearInterval(activityCheckIntervalRef.current);

      // Remove event listeners
      activityEvents.forEach((event) => {
        document.removeEventListener(event, handleActivity, true);
      });
    };
  }, [handleActivity, resetIdleTimer]);

  const contextValue: SessionManagerContextType = {
    showSessionExpiredModal,
    showSessionWarningModal,
    hideSessionModal,
    refreshSession,
    isAuthenticated: true,
    isLoading: false,
    resetIdleTimer,
    isIdle,
    minutesIdle,
  };

  return (
    <SessionManagerContext.Provider value={contextValue}>
      {children}
      <SessionExpiredModal
        isOpen={modalState.isOpen}
        onClose={hideSessionModal}
        onRetryAuth={handleManualLogout}
        type={modalState.type}
        minutesLeft={modalState.minutesLeft}
        refreshSession={refreshSession}
        onLogout={handleManualLogout}
        isIdleTimeout={modalState.type === 'idle'}
      />
    </SessionManagerContext.Provider>
  );
}

export function useSessionManager() {
  const context = useContext(SessionManagerContext);
  if (context === undefined) {
    throw new Error('useSessionManager must be used within a SessionManagerProvider');
  }
  return context;
}
