"use client";

import { ReactNode } from "react";
import { useAuth } from "@/providers/session-provider";
import { UnauthorizedPage } from "./unauthorized-page";
import { rolesManager } from "./roles-manager";

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
 * Renders children only if the user has the required role.
 * Uses the roles manager map to check permissions instead of session.
 * 
 * @param children - Content to render if permission is granted
 * @param requiredRole - Role string to check (e.g., "admin", "user:create")
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
  const { session, status, isLoading } = useAuth();

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

  // Check if user has the required permission using roles manager (checks both permissions and roles)
  const userId = session.user.id;
  
  // Populate roles manager from session if it's empty
  if (session.user.roles && rolesManager.getUserRoles(userId).length === 0) {
    rolesManager.setUserRoles(userId, session.user.roles);
    console.log('🔧 Populated roles manager from session:', { userId, roles: session.user.roles });
  }
  
  console.log('🔍 Permission Check Debug:', {
    userId,
    requiredPermission,
    userRolesFromManager: rolesManager.getUserRoles(userId),
    userRolesFromSession: session.user.roles,
    allUsersInManager: rolesManager.getAllUsers()
  });
  const hasRequiredPermission = rolesManager.hasAccess(userId, requiredPermission);
  console.log('✅ Access result:', hasRequiredPermission);

  if (!hasRequiredPermission) {
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
 * Uses the roles manager map for checking
 * 
 * @param permission - Permission string to check
 * @returns boolean indicating if user has the permission
 */
export function usePermission(permission: string): boolean {
  const { session, status } = useAuth();

  if (status === "loading" || !session?.user) {
    return false;
  }

  return rolesManager.hasRole(session.user.id, permission);
}

/**
 * Hook to check if user has any of the specified permissions
 * Uses the roles manager map for checking
 * 
 * @param permissions - Array of permission strings to check
 * @returns boolean indicating if user has at least one of the permissions
 */
export function useAnyPermission(permissions: string[]): boolean {
  const { session, status } = useAuth();

  if (status === "loading" || !session?.user) {
    return false;
  }

  return rolesManager.hasAnyRole(session.user.id, permissions);
}

/**
 * Hook to check if user has all of the specified permissions
 * Uses the roles manager map for checking
 * 
 * @param permissions - Array of permission strings to check
 * @returns boolean indicating if user has all of the permissions
 */
export function useAllRoles(permissions: string[]): boolean {
  const { session, status } = useAuth();

  if (status === "loading" || !session?.user) {
    return false;
  }

  return rolesManager.hasAllRoles(session.user.id, permissions);
}

/**
 * Hook to get all roles for current user
 * Uses the roles manager map
 * 
 * @returns array of role strings for the current user
 */
export function useUserRoles(): string[] {
  const { session, status } = useAuth();

  if (status === "loading" || !session?.user) {
    return [];
  }

  return rolesManager.getUserRoles(session.user.id);
}
