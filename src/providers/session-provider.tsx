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

interface Organization {
  name: string;
  id: string;
}

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
 * Hook for organization-based access control
 */
export function useUserOrganizations() {
  const { session } = useOptimizedSession()
  
  const hasOrganization = useCallback((organizationId: string) => {
    return session?.user?.organizations?.some(org => org.id === organizationId) ?? false
  }, [session?.user?.organizations])
  
  const hasAnyOrganization = useCallback((organizationIds: string[]) => {
    return organizationIds.some(orgId => 
      session?.user?.organizations?.some(org => org.id === orgId)
    ) ?? false
  }, [session?.user?.organizations])
  
  const getOrganizationByName = useCallback((name: string) => {
    return session?.user?.organizations?.find(org => org.name === name) || null
  }, [session?.user?.organizations])
  
  const getOrganizationById = useCallback((id: string) => {
    return session?.user?.organizations?.find(org => org.id === id) || null
  }, [session?.user?.organizations])
  
  return {
    organizations: session?.user?.organizations || [],
    currentOrganization: session?.user?.currentOrganization || null,
    hasOrganization,
    hasAnyOrganization,
    getOrganizationByName,
    getOrganizationById
  }
}

/**
 * Hook for combined role and organization checks
 */
export function usePermissions() {
  const { hasRole, hasAnyRole, hasAllRoles } = useUserRoles()
  const { hasOrganization, hasAnyOrganization } = useUserOrganizations()
  
  const hasRoleInOrganization = useCallback((role: string, organizationId: string) => {
    return hasRole(role) && hasOrganization(organizationId)
  }, [hasRole, hasOrganization])
  
  const hasAnyRoleInOrganization = useCallback((roles: string[], organizationId: string) => {
    return hasAnyRole(roles) && hasOrganization(organizationId)
  }, [hasAnyRole, hasOrganization])
  
  return {
    hasRoleInOrganization,
    hasAnyRoleInOrganization
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
    idToken: session?.idToken,
    roles: session?.user?.roles || [],
    organizations: session?.user?.organizations || [],
    currentOrganization: session?.user?.currentOrganization || null
  }
}
