/**
 * RoleGuard component
 *
 * Conditionally renders content based on user roles.
 */
import React from 'react';
import { Role, RoleCheckOptions } from '../types';
import { useRBAC } from '../context';

export interface RoleGuardProps {
  /**
   * The role(s) required to render children
   */
  role: Role | Role[];

  /**
   * Options for role checking
   */
  options?: RoleCheckOptions;

  /**
   * Content to render when role check passes
   */
  children: React.ReactNode;

  /**
   * Content to render when role check fails (optional)
   */
  fallback?: React.ReactNode;
}

/**
 * Guard component that renders children only if the user has the specified role(s)
 */
export const RoleGuard: React.FC<RoleGuardProps> = ({
  role,
  options,
  children,
  fallback = null,
}) => {
  const { hasRole } = useRBAC();

  // Check if user has the required role(s)
  const userHasRole = hasRole(role, options);

  return userHasRole ? <>{children}</> : <>{fallback}</>;
};
