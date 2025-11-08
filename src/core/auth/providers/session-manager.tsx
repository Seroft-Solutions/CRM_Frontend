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
import { clearAuthStorage } from '@/lib/auth-cleanup';

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
  idleTimeoutMinutes?: number;
  warningBeforeLogoutMinutes?: number;
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

  const { onSessionExpired } = useSessionEvents();

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
    setModalState((prev) => {
      if (prev.type === 'warning') {
        return { isOpen: false, type: 'expired' };
      }
      return prev;
    });
  }, []);

  const resetIdleTimer = useCallback(() => {
    const now = Date.now();
    setLastActivity(now);
    setIsIdle(false);
    setMinutesIdle(0);

    setModalState((prev) => {
      if (prev.isOpen && prev.type === 'warning') {
        return { isOpen: false, type: 'expired' };
      }
      return prev;
    });

    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);

    const warningTime = (idleTimeoutMinutes - warningBeforeLogoutMinutes) * 60 * 1000;
    warningTimerRef.current = setTimeout(() => {
      setIsIdle(true);
      showSessionWarningModal(warningBeforeLogoutMinutes);
    }, warningTime);

    const logoutTime = idleTimeoutMinutes * 60 * 1000;
    logoutTimerRef.current = setTimeout(() => {
      showIdleTimeoutModal();
    }, logoutTime);
  }, [
    idleTimeoutMinutes,
    warningBeforeLogoutMinutes,
    showSessionWarningModal,
    showIdleTimeoutModal,
  ]);

  const refreshSession = useCallback(async (): Promise<boolean> => {
    try {
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
          resetIdleTimer();
          hideSessionModal();

          if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('token-refreshed'));
          }

          return true;
        }
      }

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
      clearAuthStorage();

      await signOut({
        callbackUrl: '/',
        redirect: true,
      });
    } catch (error) {
      console.error('Logout failed:', error);

      clearAuthStorage();
      window.location.href = '/';
    }
  }, []);

  const handleActivity = useCallback(() => {
    resetIdleTimer();
  }, [resetIdleTimer]);

  useEffect(() => {
    if (!activityCheckIntervalRef.current) {
      activityCheckIntervalRef.current = setInterval(() => {
        const now = Date.now();
        const minutesSinceActivity = Math.floor((now - lastActivity) / 60000);
        setMinutesIdle(minutesSinceActivity);
      }, 30000);
    }

    return () => {
      if (activityCheckIntervalRef.current) {
        clearInterval(activityCheckIntervalRef.current);
        activityCheckIntervalRef.current = null;
      }
    };
  }, [lastActivity]);

  useEffect(() => {
    if (session?.error === 'RefreshAccessTokenError') {
      console.log('Session refresh error detected from NextAuth');

      if (!modalState.isOpen) {
        showSessionExpiredModal();
      }
    }
  }, [session?.error, showSessionExpiredModal, modalState.isOpen]);

  useEffect(() => {
    const unsubscribe = onSessionExpired((event) => {
      console.log('Session expired from API call:', event.message);
      showSessionExpiredModal();
    });

    return unsubscribe;
  }, [onSessionExpired, showSessionExpiredModal]);

  useEffect(() => {
    resetIdleTimer();

    activityEvents.forEach((event) => {
      document.addEventListener(event, handleActivity, true);
    });

    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
      if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
      if (activityCheckIntervalRef.current) clearInterval(activityCheckIntervalRef.current);

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
