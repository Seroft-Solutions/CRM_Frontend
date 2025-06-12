/**
 * Data Access Layer (DAL) for centralized session and authentication management
 * 
 * This module provides a centralized way to handle authentication and authorization
 * across the application, with caching to prevent redundant session calls.
 */

import { cache } from 'react'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { organizationApiService, type UserOrganization } from '@/services/organization/organization-api.service'

// Cached auth() call to avoid repeated session lookups within a request
const getAuthSession = cache(async () => {
  return auth()
})

/**
 * Verify user session with caching
 * 
 * This function uses React's cache API to memoize the session verification
 * during a single render pass, preventing multiple auth() calls.
 */
export const verifySession = cache(async () => {
  const session = await getAuthSession()
  
  if (!session?.user) {
    redirect('/')
  }

  return {
    isAuth: true,
    userId: session.user.id,
    user: session.user,
    roles: session.user.roles || []
  }
})

/**
 * Get session without redirect (for optional auth checks)
 */
export const getSession = cache(async () => {
  const session = await getAuthSession()
  
  if (!session?.user) {
    return null
  }

  return {
    isAuth: true,
    userId: session.user.id,
    user: session.user,
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

/**
 * Get current user's organizations (API-based)
 */
export const getUserOrganizations = async (): Promise<UserOrganization[]> => {
  try {
    return await organizationApiService.getUserOrganizations()
  } catch (error) {
    console.error('Error fetching user organizations:', error)
    return []
  }
}

/**
 * Get current user's active organization (first one)
 */
export const getCurrentOrganization = async (): Promise<UserOrganization | null> => {
  const organizations = await getUserOrganizations()
  return organizations[0] || null
}

/**
 * Check if user belongs to a specific organization
 */
export const hasOrganization = async (organizationId: string): Promise<boolean> => {
  const organizations = await getUserOrganizations()
  return organizations.some(org => org.id === organizationId)
}

/**
 * Check if user belongs to any of the specified organizations
 */
export const hasAnyOrganization = async (organizationIds: string[]): Promise<boolean> => {
  const organizations = await getUserOrganizations()
  return organizationIds.some(orgId => 
    organizations.some(org => org.id === orgId)
  )
}

/**
 * Get organization by name
 */
export const getOrganizationByName = async (organizationName: string): Promise<UserOrganization | null> => {
  const organizations = await getUserOrganizations()
  return organizations.find(org => org.name === organizationName) || null
}

/**
 * Get organization by ID
 */
export const getOrganizationById = async (organizationId: string): Promise<UserOrganization | null> => {
  const organizations = await getUserOrganizations()
  return organizations.find(org => org.id === organizationId) || null
}

/**
 * Check if user has role AND belongs to organization (combined check)
 */
export const hasRoleInOrganization = async (
  requiredRole: string,
  organizationId: string
): Promise<boolean> => {
  const [roleCheck, orgCheck] = await Promise.all([
    hasRole(requiredRole),
    hasOrganization(organizationId)
  ])
  
  return roleCheck && orgCheck
}

/**
 * Retrieve the current access token
 */
export const getAccessToken = cache(async (): Promise<string | null> => {
  const session = await getAuthSession()
  return session?.access_token ?? null
})
