/**
 * Permission Guard Component
 * Controls access to UI components based on user permissions
 */

'use client';

import { ReactNode } from 'react';
import { useAuth } from '@/core/auth/providers/session-provider';
import { useUserRoles } from '@/core/auth/hooks/use-user-roles';
import { UnauthorizedPage } from '@/core/auth/components/unauthorized-page';
import { normalizeRole } from '@/core/auth/utils';
import type { PermissionGuardProps } from '../types';

/**
 * Permission Guard Component
 *
 * Renders children only if the user has the required permission.
 * Uses the optimized session provider to reduce redundant session calls.
 *
 * Permission naming convention:
 * - {entityName}:create - Can create new entities
 * - {entityName}:read   - Can view entities
 * - {entityName}:update - Can edit entities
 * - {entityName}:delete - Can delete entities
 */
export function PermissionGuard({
  children,
  requiredPermission,
  fallback = null,
  showUnauthorizedPage = true,
  unauthorizedTitle,
  unauthorizedDescription,
}: PermissionGuardProps) {
  const { session, status, isLoading } = useAuth();
  const { roles: userRoles, isLoading: rolesLoading } = useUserRoles();

  // Loading state
  if (isLoading || rolesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Not authenticated
  if (!session?.user) {
    if (showUnauthorizedPage) {
      return (
        <UnauthorizedPage
          title="Authentication Required"
          description="You need to be signed in to access this resource."
          requiredPermission={requiredPermission}
        />
      );
    }
    return <>{fallback}</>;
  }

  // Check if user has the required permission
  // Roles from useUserRoles are already normalized, don't normalize again
  const normalizedRequiredPermission = normalizeRole(requiredPermission);
  const hasPermission = userRoles.includes(normalizedRequiredPermission);

  if (!hasPermission) {
    if (showUnauthorizedPage) {
      return (
        <UnauthorizedPage
          title={unauthorizedTitle}
          description={unauthorizedDescription}
          requiredPermission={requiredPermission}
        />
      );
    }
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Inline Permission Guard Component
 *
 * For smaller UI elements like buttons, use this component which doesn't show
 * the full unauthorized page but just hides the content.
 */
export function InlinePermissionGuard({
  children,
  requiredPermission,
  fallback = null,
}: {
  children: ReactNode;
  requiredPermission: string;
  fallback?: ReactNode;
}) {
  return (
    <PermissionGuard
      requiredPermission={requiredPermission}
      fallback={fallback}
      showUnauthorizedPage={false}
    >
      {children}
    </PermissionGuard>
  );
}

/**
 * Hook to check if user has a specific permission
 * Uses the dynamic role fetching for better performance
 */
export function usePermission(permission: string): boolean {
  const { session, status } = useAuth();
  const { roles: userRoles, isLoading } = useUserRoles();

  if (status === 'loading' || isLoading || !session?.user) {
    return false;
  }

  // If no permission is required, always return true
  if (!permission || permission === '') {
    return true;
  }

  // Roles from useUserRoles are already normalized
  const normalizedPermission = normalizeRole(permission);
  return userRoles.includes(normalizedPermission);
}

/**
 * Hook to check if user has any of the specified roles
 */
export function useAnyPermission(roles: string[]): boolean {
  const { session, status } = useAuth();
  const { roles: userRoles, isLoading } = useUserRoles();

  if (status === 'loading' || isLoading || !session?.user) {
    return false;
  }

  // Roles from useUserRoles are already normalized, don't normalize again
  const normalizedRequiredRoles = roles.map(normalizeRole);

  return normalizedRequiredRoles.some((permission) => userRoles.includes(permission));
}

/**
 * Hook to check if user has all of the specified roles
 */
export function useAllRoles(roles: string[]): boolean {
  const { session, status } = useAuth();
  const { roles: userRoles, isLoading } = useUserRoles();

  if (status === 'loading' || isLoading || !session?.user) {
    return false;
  }

  // Roles from useUserRoles are already normalized, don't normalize again
  const normalizedRequiredRoles = roles.map(normalizeRole);

  return normalizedRequiredRoles.every((permission) => userRoles.includes(permission));
}
