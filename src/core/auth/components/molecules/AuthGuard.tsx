/**
 * AuthGuard component
 *
 * A component that conditionally renders content based on authentication state
 * and optionally role/permission requirements.
 */
import React, { useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useAuth } from '../../hooks';
import { PermissionGuard, RoleGuard } from '../../rbac/guards';

export interface AuthGuardProps {
  /** The protected content to render if access is granted */
  children: React.ReactNode;
  /** Content to render if access is denied */
  fallback?: React.ReactNode;
  /** Loading state content */
  loading?: React.ReactNode;
  /** Function called when authentication fails */
  onAuthFailure?: () => void;
  /** Path to redirect to if not authenticated */
  redirectTo?: string;
  /** Optional save return URL functionality */
  saveReturnUrl?: boolean;
  /** Array of roles required for access */
  requiredRoles?: string[];
  /** Array of permissions required for access */
  requiredPermissions?: string[];
  /** Whether to require all roles/permissions or just one */
  requireAll?: boolean;
}

/**
 * Enhanced guard component that combines authentication and RBAC checks
 * Can be used for both simple authentication checks and complex role/permission requirements
 */
export const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  fallback = null,
  loading = null,
  onAuthFailure,
  redirectTo,
  saveReturnUrl = false,
  requiredRoles = [],
  requiredPermissions = [],
  requireAll = true,
}) => {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Handle authentication failure
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Call onAuthFailure callback if provided
      if (onAuthFailure) {
        onAuthFailure();
      }

      // Handle redirection if configured
      if (redirectTo) {
        // Save return URL if enabled
        if (saveReturnUrl) {
          const returnUrl = pathname + (searchParams ? `?${searchParams.toString()}` : '');
          sessionStorage.setItem('returnUrl', returnUrl);
        }

        // Redirect to login
        router.push(redirectTo);
      }
    }
  }, [
    isAuthenticated,
    isLoading,
    onAuthFailure,
    redirectTo,
    saveReturnUrl,
    router,
    pathname,
    searchParams,
  ]);

  // Show loading state
  if (isLoading) {
    return <>{loading}</>;
  }

  // Show fallback or redirect if not authenticated
  if (!isAuthenticated) {
    return <>{fallback}</>;
  }

  // If no roles or permissions required, render children
  if (requiredRoles.length === 0 && requiredPermissions.length === 0) {
    return <>{children}</>;
  }

  // Apply role guard if roles are required
  if (requiredRoles.length > 0) {
    return (
      <RoleGuard roles={requiredRoles} requireAll={requireAll} fallback={fallback}>
        {requiredPermissions.length > 0 ? (
          <PermissionGuard
            permissions={requiredPermissions}
            requireAll={requireAll}
            fallback={fallback}
          >
            {children}
          </PermissionGuard>
        ) : (
          children
        )}
      </RoleGuard>
    );
  }

  // Apply permission guard if only permissions are required
  if (requiredPermissions.length > 0) {
    return (
      <PermissionGuard
        permissions={requiredPermissions}
        requireAll={requireAll}
        fallback={fallback}
      >
        {children}
      </PermissionGuard>
    );
  }

  // Default case - should never reach here
  return <>{children}</>;
};

export interface GuestGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  loading?: React.ReactNode;
  onAuthSuccess?: () => void;
  redirectTo?: string;
}

/**
 * Guard component that only renders children if user is NOT authenticated
 */
export const GuestGuard: React.FC<GuestGuardProps> = ({
  children,
  fallback = null,
  loading = null,
  onAuthSuccess,
  redirectTo,
}) => {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  // Handle authenticated user
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      // Call onAuthSuccess callback if provided
      if (onAuthSuccess) {
        onAuthSuccess();
      }

      // Redirect if path provided
      if (redirectTo) {
        router.push(redirectTo);
      }
    }
  }, [isAuthenticated, isLoading, onAuthSuccess, redirectTo, router]);

  if (isLoading) {
    return <>{loading}</>;
  }

  return !isAuthenticated ? <>{children}</> : <>{fallback}</>;
};
