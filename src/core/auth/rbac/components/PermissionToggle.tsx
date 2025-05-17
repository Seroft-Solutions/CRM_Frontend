/**
 * PermissionToggle component
 *
 * A toggle that shows/hides content based on permissions.
 */
import React from 'react';
import { Permission, PermissionCheckOptions } from '../types';
import { usePermission } from '../hooks';

export interface PermissionToggleProps {
  /**
   * The permission(s) to check
   */
  permission: Permission | Permission[];

  /**
   * The content to show when permission check passes
   */
  children: React.ReactNode;

  /**
   * Alternative content to show when permission check fails
   */
  fallback?: React.ReactNode;

  /**
   * Whether to hide completely when permission check fails
   */
  hideOnFail?: boolean;

  /**
   * Permission check options
   */
  options?: PermissionCheckOptions;

  /**
   * Additional CSS class
   */
  className?: string;
}

/**
 * A component that toggles visibility based on permissions
 */
export const PermissionToggle: React.FC<PermissionToggleProps> = ({
  permission,
  children,
  fallback,
  hideOnFail = false,
  options,
  className = '',
}) => {
  const hasPermission = usePermission(permission, options);

  if (!hasPermission) {
    if (hideOnFail) {
      return null;
    }

    return fallback ? <>{fallback}</> : null;
  }

  return <div className={className}>{children}</div>;
};
