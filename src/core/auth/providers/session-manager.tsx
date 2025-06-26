/**
 * Session Manager Provider
 * Advanced session management with automatic recovery and UI notifications
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
import { signIn } from 'next-auth/react';
import { useSessionMonitor } from '../hooks/use-session-monitor';
import { SessionExpiredModal } from '../components/session-expired-modal';
import { useSessionEvents } from '../session/events';
import { refreshKeycloakToken } from '../tokens/refresh';

interface SessionManagerContextType {
  showSessionExpiredModal: () => void;
  showSessionWarningModal: (minutesLeft: number) => void;
  hideSessionModal: () => void;
  refreshSession: () => Promise<boolean>;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const SessionManagerContext = createContext<SessionManagerContextType | undefined>(undefined);

interface SessionManagerProviderProps {
  children: ReactNode;
}

export function SessionManagerProvider({ children }: SessionManagerProviderProps) {
  // Early return to prevent SSR issues
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    type: 'expired' | 'warning';
    minutesLeft?: number;
  }>({
    isOpen: false,
    type: 'expired',
  });

  const minutesIdleRef = useRef(0);
  
  // Only use session events if mounted
  const sessionEvents = isMounted ? useSessionEvents() : { onSessionExpired: () => () => {} };
  const { onSessionExpired: onApiSessionExpired } = sessionEvents;

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

  const hideSessionModal = useCallback(() => {
    setModalState((prev) => ({
      ...prev,
      isOpen: false,
    }));
  }, []);

  const refreshSession = useCallback(async (): Promise<boolean> => {
    if (!isMounted) return false;
    
    try {
      // Get current session to access refresh token
      const response = await fetch('/api/auth/session');
      if (!response.ok) return false;
      
      const session = await response.json();
      if (!session?.refresh_token) return false;

      const result = await refreshKeycloakToken(session.refresh_token);
      if (result.success) {
        hideSessionModal();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Session refresh failed:', error);
      return false;
    }
  }, [hideSessionModal, isMounted]);

  const attemptSessionRecovery = useCallback(async () => {
    if (!isMounted) return;
    
    if (minutesIdleRef.current < 10) {
      const refreshed = await refreshSession();
      if (!refreshed) {
        // Attempt silent re-authentication without showing the modal
        await signIn('keycloak', {
          callbackUrl: window.location.href,
          redirect: true,
        });
      }
    } else {
      showSessionExpiredModal();
    }
  }, [showSessionExpiredModal, refreshSession, isMounted]);

  const handleRetryAuth = useCallback(() => {
    // Force a hard reload to clear any stale state
    window.location.href = '/';
  }, []);

  // Only use session monitor if mounted
  const sessionMonitorResult = useSessionMonitor(isMounted ? {
    checkInterval: 60000, // Check every minute
    onSessionExpired: attemptSessionRecovery,
    onSessionRestored: hideSessionModal,
    warningThreshold: 2, // Show warning 2 minutes before expiry
    onSessionWarning: showSessionWarningModal,
    idleTimeout: 10, // User considered idle after 10 minutes
  } : {});

  const { isAuthenticated = false, isLoading = true, isIdle = false, minutesIdle = 0, refreshSession: hookRefreshSession } = sessionMonitorResult;

  useEffect(() => {
    minutesIdleRef.current = minutesIdle;
  }, [minutesIdle]);

  // Listen to API session events
  useEffect(() => {
    const unsubscribe = onApiSessionExpired(async () => {
      await attemptSessionRecovery();
    });
    return unsubscribe;
  }, [onApiSessionExpired, attemptSessionRecovery]);

  const contextValue: SessionManagerContextType = {
    showSessionExpiredModal,
    showSessionWarningModal,
    hideSessionModal,
    refreshSession: hookRefreshSession || refreshSession,
    isAuthenticated,
    isLoading,
  };

  return (
    <SessionManagerContext.Provider value={contextValue}>
      {children}
      <SessionExpiredModal
        isOpen={modalState.isOpen}
        onClose={hideSessionModal}
        onRetryAuth={handleRetryAuth}
        type={modalState.type}
        minutesLeft={modalState.minutesLeft}
        refreshSession={refreshSession}
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
