/**
 * Border foundations
 *
 * Defines the border styles, radii, and shadows for the design system.
 */

export const borderWidths = {
  0: '0px',
  1: '1px',
  2: '2px',
  4: '4px',
  8: '8px',
  DEFAULT: '1px',
};

export const borderStyles = {
  solid: 'solid',
  dashed: 'dashed',
  dotted: 'dotted',
  double: 'double',
  none: 'none',
};

export const borderRadius = {
  none: '0px',
  sm: '0.125rem',
  DEFAULT: '0.25rem',
  md: '0.375rem',
  lg: '0.5rem',
  xl: '0.75rem',
  '2xl': '1rem',
  '3xl': '1.5rem',
  full: '9999px',
};

export const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  DEFAULT: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
  none: 'none',
};

export const rings = {
  DEFAULT: {
    width: '3px',
    color: 'rgba(59, 130, 246, 0.5)',
  },
  1: {
    width: '1px',
    color: 'rgba(59, 130, 246, 0.5)',
  },
  2: {
    width: '2px',
    color: 'rgba(59, 130, 246, 0.5)',
  },
  4: {
    width: '4px',
    color: 'rgba(59, 130, 246, 0.5)',
  },
  focus: {
    width: '2px',
    color: 'rgba(59, 130, 246, 0.5)',
  },
  error: {
    width: '2px',
    color: 'rgba(239, 68, 68, 0.5)',
  },
  success: {
    width: '2px',
    color: 'rgba(16, 185, 129, 0.5)',
  },
  warning: {
    width: '2px',
    color: 'rgba(245, 158, 11, 0.5)',
  },
};
