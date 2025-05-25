"use client";

import { ReactNode } from "react";
import { useOptimizedSession } from "@/providers/session-provider";
import { UnauthorizedPage } from "./unauthorized-page";

interface PermissionGuardProps {
  children: ReactNode;
  requiredPermission: string;
  fallback?: ReactNode;
  showUnauthorizedPage?: boolean;
  unauthorizedTitle?: string;
  unauthorizedDescription?: string;
}

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
 * 
 * @param children - Content to render if permission is granted
 * @param requiredPermission - Permission string to check (e.g., "user:create", "party:read")
 * @param fallback - Optional fallback content to render if permission is denied
 * @param showUnauthorizedPage - Whether to show full unauthorized page (default: true for page-level guards)
 * @param unauthorizedTitle - Custom title for unauthorized page
 * @param unauthorizedDescription - Custom description for unauthorized page
 */
export function PermissionGuard({ 
  children, 
  requiredPermission, 
  fallback = null,
  showUnauthorizedPage = true,
  unauthorizedTitle,
  unauthorizedDescription
}: PermissionGuardProps) {
  const { session, status, isLoading } = useOptimizedSession();

  // Loading state
  if (isLoading) {
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
  const userRoles = session.user.roles || [];
  const hasPermission = userRoles.includes(requiredPermission);

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
  fallback = null 
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
 * Uses the optimized session provider for better performance
 * 
 * @param permission - Permission string to check
 * @returns boolean indicating if user has the permission
 */
export function usePermission(permission: string): boolean {
  const { session, status } = useOptimizedSession();

  if (status === "loading" || !session?.user) {
    return false;
  }

  const userRoles = session.user.roles || [];
  return userRoles.includes(permission);
}

/**
 * Hook to check if user has any of the specified roles
 * Uses the optimized session provider for better performance
 * 
 * @param roles - Array of permission strings to check
 * @returns boolean indicating if user has at least one of the roles
 */
export function useAnyPermission(roles: string[]): boolean {
  const { session, status } = useOptimizedSession();

  if (status === "loading" || !session?.user) {
    return false;
  }

  const userRoles = session.user.roles || [];
  return roles.some(permission => userRoles.includes(permission));
}

/**
 * Hook to check if user has all of the specified roles
 * Uses the optimized session provider for better performance
 * 
 * @param roles - Array of permission strings to check
 * @returns boolean indicating if user has all of the roles
 */
export function useAllRoles(roles: string[]): boolean {
  const { session, status } = useOptimizedSession();

  if (status === "loading" || !session?.user) {
    return false;
  }

  const userRoles = session.user.roles || [];
  return roles.every(permission => userRoles.includes(permission));
}
