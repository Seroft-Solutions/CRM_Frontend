/**
 * Spinner component
 *
 * A reusable loading spinner component.
 */
import React from 'react';
import { colors } from '../../design-system/tokens/colors';

export interface SpinnerProps {
  /**
   * The size of the spinner
   */
  size?: 'sm' | 'md' | 'lg';

  /**
   * The color of the spinner
   */
  color?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info';

  /**
   * CSS class name
   */
  className?: string;
}

export function Spinner({ size = 'md', color = 'primary', className = '' }: SpinnerProps) {
  // Map size to dimensions
  const sizeMap = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  // Map color to classes using our design system colors
  const colorMap = {
    primary: `text-[${colors.primary[500]}]`,
    secondary: `text-[${colors.secondary[500]}]`,
    success: `text-[${colors.success[500]}]`,
    danger: `text-[${colors.danger[500]}]`,
    warning: `text-[${colors.warning[500]}]`,
    info: `text-[${colors.primary[500]}]`,
  };

  return (
    <div
      className={`inline-block animate-spin ${sizeMap[size]} ${colorMap[color]} ${className}`}
      role="status"
    >
      <svg
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      <span className="sr-only">Loading...</span>
    </div>
  );
}
