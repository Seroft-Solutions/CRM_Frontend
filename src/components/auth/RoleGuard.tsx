'use client';

import React from 'react';
import { useSession } from 'next-auth/react';

interface RoleGuardProps {
  /**
   * Roles required to render the children
   */
  requiredRoles: string[];
  /**
   * Whether to require all roles (AND) or any role (OR)
   */
  requireAll?: boolean;
  /**
   * Content to render if user has required roles
   */
  children: React.ReactNode;
  /**
   * Content to render if user does not have required roles
   * If not provided, nothing will be rendered
   */
  fallback?: React.ReactNode;
}

/**
 * Component that conditionally renders content based on user roles
 */
export function RoleGuard({
  requiredRoles,
  requireAll = false,
  children,
  fallback = null,
}: RoleGuardProps) {
  const { data: session, status } = useSession();
  
  // If session is loading, don't render anything yet
  if (status === 'loading') {
    return null;
  }

  // If user is not authenticated, render fallback
  if (status !== 'authenticated' || !session) {
    return <>{fallback}</>;
  }

  // Get user roles from session
  const userRoles = session.user.roles || [];

  // Check if user has required roles
  const hasPermission = requireAll
    ? requiredRoles.every((role) => userRoles.includes(role))
    : requiredRoles.some((role) => userRoles.includes(role));

  // Render children or fallback based on permission check
  return <>{hasPermission ? children : fallback}</>;
}

/**
 * Component that renders content if user has all required roles
 */
export function RequireAllRoles({
  roles,
  children,
  fallback = null,
}: Omit<RoleGuardProps, 'requiredRoles' | 'requireAll'> & { roles: string[] }) {
  return (
    <RoleGuard requiredRoles={roles} requireAll={true} fallback={fallback}>
      {children}
    </RoleGuard>
  );
}

/**
 * Component that renders content if user has any of the required roles
 */
export function RequireAnyRole({
  roles,
  children,
  fallback = null,
}: Omit<RoleGuardProps, 'requiredRoles' | 'requireAll'> & { roles: string[] }) {
  return (
    <RoleGuard requiredRoles={roles} requireAll={false} fallback={fallback}>
      {children}
    </RoleGuard>
  );
}