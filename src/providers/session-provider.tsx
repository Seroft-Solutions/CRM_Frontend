/**
 * Session Context Provider
 * 
 * This provides a more optimized session context that reduces redundant session calls
 * by managing session state efficiently across client components.
 */

'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { SessionProvider, useSession as useNextAuthSession } from 'next-auth/react'
import type { Session } from 'next-auth'

interface SessionContextValue {
  session: Session | null
  status: 'loading' | 'authenticated' | 'unauthenticated'
  isLoading: boolean
  error?: string
  refetch: () => void
}

const SessionContext = createContext<SessionContextValue | undefined>(undefined)

interface SessionProviderProps {
  children: React.ReactNode
  // Optional: provide session from server-side if available
  serverSession?: Session | null
}

function OptimizedSessionInner({ children, serverSession }: SessionProviderProps) {
  const { data: session, status, update } = useNextAuthSession()
  const [sessionState, setSessionState] = useState<Session | null>(serverSession || null)
  const [isInitialized, setIsInitialized] = useState(!!serverSession)

  // Update local session state when NextAuth session changes
  useEffect(() => {
    if (status !== 'loading') {
      setSessionState(session)
      setIsInitialized(true)
    }
  }, [session, status])

  const refetch = useCallback(() => {
    update()
  }, [update])

  const contextValue: SessionContextValue = {
    session: sessionState,
    status: !isInitialized ? 'loading' : status,
    isLoading: !isInitialized || status === 'loading',
    refetch
  }

  return (
    <SessionContext.Provider value={contextValue}>
      {children}
    </SessionContext.Provider>
  )
}

export function OptimizedSessionProvider({ children, serverSession }: SessionProviderProps) {
  return (
    <SessionProvider session={serverSession}>
      <OptimizedSessionInner serverSession={serverSession}>
        {children}
      </OptimizedSessionInner>
    </SessionProvider>
  )
}

/**
 * Optimized useSession hook that uses our context
 */
export function useOptimizedSession() {
  const context = useContext(SessionContext)
  
  if (context === undefined) {
    throw new Error('useOptimizedSession must be used within OptimizedSessionProvider')
  }
  
  return context
}

/**
 * Hook for role-based access control
 */
export function useUserRoles() {
  const { session } = useOptimizedSession()
  
  const hasRole = useCallback((role: string) => {
    return session?.user?.roles?.includes(role) ?? false
  }, [session?.user?.roles])
  
  const hasAnyRole = useCallback((roles: string[]) => {
    return roles.some(role => session?.user?.roles?.includes(role)) ?? false
  }, [session?.user?.roles])
  
  const hasAllRoles = useCallback((roles: string[]) => {
    return roles.every(role => session?.user?.roles?.includes(role)) ?? false
  }, [session?.user?.roles])
  
  return {
    roles: session?.user?.roles || [],
    hasRole,
    hasAnyRole,
    hasAllRoles
  }
}

/**
 * Hook for user information
 */
export function useUser() {
  const { session, status, isLoading } = useOptimizedSession()
  
  return {
    user: session?.user || null,
    isAuthenticated: status === 'authenticated',
    isLoading,
    accessToken: session?.accessToken,
    idToken: session?.idToken
  }
}
