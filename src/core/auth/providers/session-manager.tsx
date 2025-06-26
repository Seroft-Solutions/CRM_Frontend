/**
 * Session Manager Provider
 * Minimal session management to avoid React hooks issues
 */

'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from 'react';

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
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    type: 'expired' | 'warning';
    minutesLeft?: number;
  }>({
    isOpen: false,
    type: 'expired',
  });

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
    try {
      // Simple refresh without complex token logic
      window.location.reload();
      return true;
    } catch (error) {
      console.error('Session refresh failed:', error);
      return false;
    }
  }, []);

  const handleRetryAuth = useCallback(() => {
    // Force a hard reload to clear any stale state
    window.location.href = '/';
  }, []);

  const contextValue: SessionManagerContextType = {
    showSessionExpiredModal,
    showSessionWarningModal,
    hideSessionModal,
    refreshSession,
    isAuthenticated: true,
    isLoading: false,
  };

  return (
    <SessionManagerContext.Provider value={contextValue}>
      {children}
      {/* Removed SessionExpiredModal temporarily to avoid hooks issues */}
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
