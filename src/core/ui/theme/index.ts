/**
 * Theme utilities
 *
 * Theme-related utilities and configurations.
 */

/**
 * Default theme configuration
 */
export const defaultTheme = {
  colors: {
    primary: '#3B82F6',
    secondary: '#6B7280',
    success: '#10B981',
    danger: '#EF4444',
    warning: '#F59E0B',
    info: '#3B82F6',
    light: '#F3F4F6',
    dark: '#1F2937',
    white: '#FFFFFF',
    black: '#000000',
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    xxl: '3rem',
  },
  fonts: {
    sans: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    serif: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif',
    mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
  },
  fontSizes: {
    xs: '0.75rem',
    sm: '0.875rem',
    md: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    xxl: '1.5rem',
  },
  borderRadius: {
    none: '0',
    sm: '0.125rem',
    md: '0.25rem',
    lg: '0.5rem',
    xl: '0.75rem',
    full: '9999px',
  },
  shadows: {
    none: 'none',
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  },
  breakpoints: {
    xs: '320px',
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    xxl: '1536px',
  },
};

/**
 * Theme utility functions
 */
export const themeUtils = {
  /**
   * Get a color from the theme
   */
  getColor: (colorKey: keyof typeof defaultTheme.colors) => {
    return defaultTheme.colors[colorKey];
  },

  /**
   * Get a spacing value from the theme
   */
  getSpacing: (spacingKey: keyof typeof defaultTheme.spacing) => {
    return defaultTheme.spacing[spacingKey];
  },

  /**
   * Get a font from the theme
   */
  getFont: (fontKey: keyof typeof defaultTheme.fonts) => {
    return defaultTheme.fonts[fontKey];
  },

  /**
   * Get a font size from the theme
   */
  getFontSize: (fontSizeKey: keyof typeof defaultTheme.fontSizes) => {
    return defaultTheme.fontSizes[fontSizeKey];
  },

  /**
   * Get a border radius from the theme
   */
  getBorderRadius: (radiusKey: keyof typeof defaultTheme.borderRadius) => {
    return defaultTheme.borderRadius[radiusKey];
  },

  /**
   * Get a shadow from the theme
   */
  getShadow: (shadowKey: keyof typeof defaultTheme.shadows) => {
    return defaultTheme.shadows[shadowKey];
  },

  /**
   * Get a breakpoint from the theme
   */
  getBreakpoint: (breakpointKey: keyof typeof defaultTheme.breakpoints) => {
    return defaultTheme.breakpoints[breakpointKey];
  },
};
