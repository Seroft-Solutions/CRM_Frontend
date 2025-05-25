/**
 * Authentication Server Actions
 * 
 * This module provides server actions for authentication operations
 * with proper session verification to avoid multiple session calls.
 */

'use server'

import { signIn, signOut } from '@/auth'
import { verifySession, getSession } from '@/lib/dal'
import { redirect } from 'next/navigation'
import { AuthError } from 'next-auth'

/**
 * Server action for user login
 */
export async function loginAction(
  provider: string,
  formData?: FormData,
  redirectTo?: string
) {
  try {
    await signIn(provider, {
      redirectTo: redirectTo || '/dashboard',
      ...(formData && Object.fromEntries(formData.entries()))
    })
  } catch (error) {
    if (error instanceof AuthError) {
      // Handle specific auth errors
      switch (error.type) {
        case 'CredentialsSignin':
          return { error: 'Invalid credentials' }
        case 'CallbackRouteError':
          return { error: 'Authentication callback error' }
        default:
          return { error: 'Authentication failed' }
      }
    }
    // Re-throw other errors for Next.js to handle
    throw error
  }
}

/**
 * Server action for user logout
 */
export async function logoutAction() {
  try {
    await signOut({ redirectTo: '/login' })
  } catch (error) {
    console.error('Logout error:', error)
    redirect('/login')
  }
}

/**
 * Server action to get current session (for API calls)
 */
export async function getCurrentSession() {
  const session = await getSession()
  
  if (!session) {
    return null
  }

  // Return safe session data (without sensitive tokens)
  return {
    user: {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      image: session.user.image,
      roles: session.roles
    },
    isAuthenticated: session.isAuth
  }
}

/**
 * Server action to check if user has specific role
 */
export async function checkUserRole(requiredRole: string) {
  const session = await getSession()
  
  if (!session || !session.roles) {
    return false
  }

  return session.roles.includes(requiredRole)
}

/**
 * Server action to get user permissions/roles
 */
export async function getUserPermissions() {
  const session = await getSession()
  
  if (!session) {
    return { roles: [], permissions: [] }
  }

  return {
    roles: session.roles || [],
    permissions: session.roles || [] // Can be expanded to map roles to specific permissions
  }
}

/**
 * Protected server action example
 */
export async function protectedAction(data: any) {
  // Verify session using DAL (cached)
  const session = await verifySession()
  
  // Action logic here
  console.log('Protected action executed by user:', session.user.name)
  
  return { success: true, userId: session.userId }
}

/**
 * Role-based protected server action example
 */
export async function adminOnlyAction(data: any) {
  const session = await verifySession()
  
  // Check if user has admin role
  if (!session.roles.includes('admin')) {
    throw new Error('Insufficient permissions')
  }
  
  // Admin action logic here
  console.log('Admin action executed by:', session.user.name)
  
  return { success: true, message: 'Admin action completed' }
}
