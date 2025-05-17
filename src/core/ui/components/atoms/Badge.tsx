/**
 * Badge component
 *
 * A reusable badge component for displaying status, counts, or labels.
 */
import React from 'react';
import { colors } from '../../design-system/tokens/colors';

export interface BadgeProps {
  /**
   * The badge text content
   */
  children: React.ReactNode;

  /**
   * The badge variant (color)
   */
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info';

  /**
   * The badge size
   */
  size?: 'sm' | 'md' | 'lg';

  /**
   * Whether the badge is rounded (pill shape)
   */
  rounded?: boolean;

  /**
   * CSS class name
   */
  className?: string;
}

export function Badge({
  children,
  variant = 'primary',
  size = 'md',
  rounded = false,
  className = '',
}: BadgeProps) {
  // Map variants to classes using our design system colors
  const variantMap = {
    primary: `bg-[${colors.primary[100]}] text-[${colors.primary[800]}]`,
    secondary: `bg-[${colors.secondary[100]}] text-[${colors.secondary[800]}]`,
    success: `bg-[${colors.success[100]}] text-[${colors.success[800]}]`,
    danger: `bg-[${colors.danger[100]}] text-[${colors.danger[800]}]`,
    warning: `bg-[${colors.warning[100]}] text-[${colors.warning[800]}]`,
    info: `bg-[${colors.primary[100]}] text-[${colors.primary[800]}]`,
  };

  // Map sizes to classes
  const sizeMap = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-0.5',
    lg: 'text-base px-3 py-1',
  };

  // Determine border radius
  const borderRadius = rounded ? 'rounded-full' : 'rounded';

  return (
    <span
      className={`inline-flex items-center font-medium ${variantMap[variant]} ${sizeMap[size]} ${borderRadius} ${className}`}
    >
      {children}
    </span>
  );
}
