/**
 * PermissionGuard component
 *
 * Conditionally renders content based on user permissions.
 */
import React from 'react';
import { Permission, PermissionCheckOptions } from '../types';
import { useRBAC } from '../context';

export interface PermissionGuardProps {
  /**
   * The permission(s) required to render children
   */
  permission: Permission | Permission[];

  /**
   * Options for permission checking
   */
  options?: PermissionCheckOptions;

  /**
   * Content to render when permission check passes
   */
  children: React.ReactNode;

  /**
   * Content to render when permission check fails (optional)
   */
  fallback?: React.ReactNode;
}

/**
 * Guard component that renders children only if the user has the specified permission(s)
 */
export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  permission,
  options,
  children,
  fallback = null,
}) => {
  const { hasPermission } = useRBAC();

  // Check if user has the required permission(s)
  const canAccess = hasPermission(permission, options);

  return canAccess ? <>{children}</> : <>{fallback}</>;
};
