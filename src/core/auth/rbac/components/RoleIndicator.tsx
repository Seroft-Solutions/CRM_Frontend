/**
 * RoleIndicator component
 *
 * A visual indicator for user roles.
 */
import React from 'react';
import { Role } from '../types';
import { useUserRoles } from '../hooks';

export interface RoleIndicatorProps {
  /**
   * Roles to highlight (if not provided, will show all user roles)
   */
  roles?: Role[];

  /**
   * Color scheme for roles (custom colors by role name)
   */
  colorScheme?: Record<string, string>;

  /**
   * Default color for roles not in colorScheme
   */
  defaultColor?: string;

  /**
   * Size of the indicator
   */
  size?: 'sm' | 'md' | 'lg';

  /**
   * Additional CSS class
   */
  className?: string;
}

/**
 * A component that displays user roles as visual indicators
 */
export const RoleIndicator: React.FC<RoleIndicatorProps> = ({
  roles,
  colorScheme = {},
  defaultColor = 'bg-gray-200 text-gray-800',
  size = 'md',
  className = '',
}) => {
  const userRoles = useUserRoles();

  // Filter roles to display
  const displayRoles = roles ? userRoles.filter(role => roles.includes(role)) : userRoles;

  if (displayRoles.length === 0) {
    return null;
  }

  // Size classes
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {displayRoles.map(role => (
        <span
          key={role}
          className={`inline-flex items-center rounded-full font-medium ${sizeClasses[size]} ${colorScheme[role] || defaultColor}`}
        >
          {role}
        </span>
      ))}
    </div>
  );
};
