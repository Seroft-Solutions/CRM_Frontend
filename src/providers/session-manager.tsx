'use client'

import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useSessionMonitor } from '@/hooks/use-session-monitor'
import { SessionExpiredModal } from '@/components/auth/session-expired-modal'
import { useSessionEvents } from '@/lib/session-events'

interface SessionManagerContextType {
  showSessionExpiredModal: () => void
  showSessionWarningModal: (minutesLeft: number) => void
  hideSessionModal: () => void
  refreshSession: () => Promise<void>
  isAuthenticated: boolean
  isLoading: boolean
}

const SessionManagerContext = createContext<SessionManagerContextType | undefined>(undefined)

interface SessionManagerProviderProps {
  children: ReactNode
}

export function SessionManagerProvider({ children }: SessionManagerProviderProps) {
  const { update: updateSession } = useSession()
  const [modalState, setModalState] = useState<{
    isOpen: boolean
    type: 'expired' | 'warning'
    minutesLeft?: number
  }>({
    isOpen: false,
    type: 'expired'
  })

  const { onSessionExpired: onApiSessionExpired } = useSessionEvents()

  const showSessionExpiredModal = useCallback(() => {
    setModalState({
      isOpen: true,
      type: 'expired'
    })
  }, [])

  const showSessionWarningModal = useCallback((minutesLeft: number) => {
    setModalState({
      isOpen: true,
      type: 'warning',
      minutesLeft
    })
  }, [])

  const hideSessionModal = useCallback(() => {
    setModalState(prev => ({
      ...prev,
      isOpen: false
    }))
  }, [])

  const refreshSession = useCallback(async () => {
    try {
      console.log('Refreshing session...')
      await updateSession()
      hideSessionModal()
      console.log('Session refreshed successfully')
    } catch (error) {
      console.error('Failed to refresh session:', error)
      showSessionExpiredModal()
    }
  }, [updateSession, hideSessionModal, showSessionExpiredModal])

  const handleRetryAuth = useCallback(() => {
    // Force a hard reload to clear any stale state
    window.location.href = '/'
  }, [])

  // Listen to API session events
  useEffect(() => {
    const unsubscribe = onApiSessionExpired(() => {
      showSessionExpiredModal()
    })
    return unsubscribe
  }, [onApiSessionExpired, showSessionExpiredModal])

  const { isAuthenticated, isLoading } = useSessionMonitor({
    checkInterval: 60000, // Check every minute
    onSessionExpired: showSessionExpiredModal,
    onSessionRestored: hideSessionModal,
    warningThreshold: 2, // Show warning 2 minutes before expiry
    onSessionWarning: showSessionWarningModal
  })

  const contextValue: SessionManagerContextType = {
    showSessionExpiredModal,
    showSessionWarningModal,
    hideSessionModal,
    refreshSession,
    isAuthenticated,
    isLoading
  }

  return (
    <SessionManagerContext.Provider value={contextValue}>
      {children}
      <SessionExpiredModal
        isOpen={modalState.isOpen}
        onClose={hideSessionModal}
        onRetryAuth={handleRetryAuth}
        type={modalState.type}
        minutesLeft={modalState.minutesLeft}
      />
    </SessionManagerContext.Provider>
  )
}

export function useSessionManager() {
  const context = useContext(SessionManagerContext)
  if (context === undefined) {
    throw new Error('useSessionManager must be used within a SessionManagerProvider')
  }
  return context
}
