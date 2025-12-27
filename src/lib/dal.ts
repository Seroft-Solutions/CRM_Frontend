/**
 * Data Access Layer (DAL) for centralized session and authentication management
 *
 * This module provides a centralized way to handle authentication and authorization
 * across the application, with caching to prevent redundant session calls.
 */

import { cache } from 'react';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { normalizeRole } from '@/core/auth/utils';
import {
  organizationApiService,
  type UserOrganization,
} from '@/services/organization/organization-api.service';

async function fetchUserAccount(): Promise<{ authorities?: string[] } | null> {
  try {
    const session = await getAuthSession();
    if (!session?.access_token) {
      return null;
    }

    const baseUrl = process.env.NEXT_PUBLIC_SPRING_API_URL || 'https://localhost:8080';
    const response = await fetch(`${baseUrl}/api/account`, {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Failed to fetch user account:', response.status);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching user account:', error);
    return null;
  }
}

const getAuthSession = cache(async () => {
  return auth();
});

/**
 * Get user roles dynamically from backend API
 * This avoids storing roles in session to prevent size limits
 */
const getUserRolesFromAPI = cache(async (): Promise<string[]> => {
  try {
    const accountData = await fetchUserAccount();

    if (!accountData?.authorities) {
      return [];
    }

    return accountData.authorities.map(normalizeRole);
  } catch (error) {
    console.error('Failed to fetch roles from API:', error);
    return [];
  }
});

/**
 * Verify user session with caching
 *
 * This function uses React's cache API to memoize the session verification
 * during a single render pass, preventing multiple auth() calls.
 */
export const verifySession = cache(async () => {
  const session = await getAuthSession();

  if (!session?.user) {
    redirect('/');
  }

  const roles = await getUserRolesFromAPI();

  return {
    isAuth: true,
    userId: session.user.id,
    user: session.user,
    roles,
  };
});

/**
 * Get session without redirect (for optional auth checks)
 */
export const getSession = cache(async () => {
  const session = await getAuthSession();

  if (!session?.user) {
    return null;
  }

  const roles = await getUserRolesFromAPI();

  return {
    isAuth: true,
    userId: session.user.id,
    user: session.user,
    roles,
  };
});

/**
 * Check if user has required role
 */
export const hasRole = async (requiredRole: string): Promise<boolean> => {
  const session = await getSession();
  if (!session?.roles) return false;

  const normalizedUserRoles = session.roles.map(normalizeRole);
  const normalizedRequiredRole = normalizeRole(requiredRole);

  return normalizedUserRoles.includes(normalizedRequiredRole);
};

/**
 * Check if user has any of the required roles
 */
export const hasAnyRole = async (requiredRoles: string[]): Promise<boolean> => {
  const session = await getSession();
  if (!session?.roles) return false;

  const normalizedUserRoles = session.roles.map(normalizeRole);
  const normalizedRequiredRoles = requiredRoles.map(normalizeRole);

  return normalizedRequiredRoles.some((role) => normalizedUserRoles.includes(role));
};

/**
 * Get current user's roles
 */
export const getUserRoles = async (): Promise<string[]> => {
  return getUserRolesFromAPI();
};

/**
 * Get current user's organizations (API-based)
 */
export const getUserOrganizations = async (): Promise<UserOrganization[]> => {
  try {
    return await organizationApiService.getUserOrganizations();
  } catch (error) {
    console.error('Error fetching user organizations:', error);
    return [];
  }
};

/**
 * Get current user's active organization (first one)
 */
export const getCurrentOrganization = async (): Promise<UserOrganization | null> => {
  const organizations = await getUserOrganizations();
  return organizations[0] || null;
};

/**
 * Check if user belongs to a specific organization
 */
export const hasOrganization = async (organizationId: string): Promise<boolean> => {
  const organizations = await getUserOrganizations();
  return organizations.some((org) => org.id === organizationId);
};

/**
 * Check if user belongs to any of the specified organizations
 */
export const hasAnyOrganization = async (organizationIds: string[]): Promise<boolean> => {
  const organizations = await getUserOrganizations();
  return organizationIds.some((orgId) => organizations.some((org) => org.id === orgId));
};

/**
 * Get organization by name
 */
export const getOrganizationByName = async (
  organizationName: string
): Promise<UserOrganization | null> => {
  const organizations = await getUserOrganizations();
  return organizations.find((org) => org.name === organizationName) || null;
};

/**
 * Get organization by ID
 */
export const getOrganizationById = async (
  organizationId: string
): Promise<UserOrganization | null> => {
  const organizations = await getUserOrganizations();
  return organizations.find((org) => org.id === organizationId) || null;
};

/**
 * Check if user has role AND belongs to organization (combined check)
 */
export const hasRoleInOrganization = async (
  requiredRole: string,
  organizationId: string
): Promise<boolean> => {
  const [roleCheck, orgCheck] = await Promise.all([
    hasRole(requiredRole),
    hasOrganization(organizationId),
  ]);

  return roleCheck && orgCheck;
};

/**
 * Retrieve the current access token
 */
export const getAccessToken = cache(async (): Promise<string | null> => {
  const session = await getAuthSession();
  if (session?.error) {
    return null;
  }
  return session?.access_token ?? null;
});
