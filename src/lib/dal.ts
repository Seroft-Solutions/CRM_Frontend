/**
 * Data Access Layer (DAL) for centralized session and authentication management
 * 
 * This module provides a centralized way to handle authentication and authorization
 * across the application, with caching to prevent redundant session calls.
 */

import 'server-only'
import { cache } from 'react'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'

/**
 * Verify user session with caching
 * 
 * This function uses React's cache API to memoize the session verification
 * during a single render pass, preventing multiple auth() calls.
 */
export const verifySession = cache(async () => {
  const session = await auth()
  
  if (!session?.user) {
    redirect('/login')
  }

  return {
    isAuth: true,
    userId: session.user.id,
    user: session.user,
    accessToken: session.accessToken,
    idToken: session.idToken,
    roles: session.user.roles || []
  }
})

/**
 * Get session without redirect (for optional auth checks)
 */
export const getSession = cache(async () => {
  const session = await auth()
  
  if (!session?.user) {
    return null
  }

  return {
    isAuth: true,
    userId: session.user.id,
    user: session.user,
    accessToken: session.accessToken,
    idToken: session.idToken,
    roles: session.user.roles || []
  }
})

/**
 * Check if user has required role
 */
export const hasRole = async (requiredRole: string): Promise<boolean> => {
  const session = await getSession()
  return session?.roles?.includes(requiredRole) ?? false
}

/**
 * Check if user has any of the required roles
 */
export const hasAnyRole = async (requiredRoles: string[]): Promise<boolean> => {
  const session = await getSession()
  if (!session?.roles) return false
  
  return requiredRoles.some(role => session.roles.includes(role))
}

/**
 * Get current user's roles
 */
export const getUserRoles = async (): Promise<string[]> => {
  const session = await getSession()
  return session?.roles || []
}
