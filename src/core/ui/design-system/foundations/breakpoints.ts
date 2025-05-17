/**
 * Breakpoint foundations
 *
 * Defines the responsive breakpoints for the design system.
 */

export const breakpoints = {
  xs: '320px', // Extra small devices (phones)
  sm: '640px', // Small devices (large phones, small tablets)
  md: '768px', // Medium devices (tablets)
  lg: '1024px', // Large devices (desktops)
  xl: '1280px', // Extra large devices (large desktops)
  '2xl': '1536px', // Very large screens
};

/**
 * Media query helpers
 */
export const media = {
  /**
   * Creates a min-width media query
   *
   * @param breakpoint - Breakpoint key
   * @returns Media query string
   */
  up: (breakpoint: keyof typeof breakpoints) => `@media (min-width: ${breakpoints[breakpoint]})`,

  /**
   * Creates a max-width media query
   *
   * @param breakpoint - Breakpoint key
   * @returns Media query string
   */
  down: (breakpoint: keyof typeof breakpoints) => {
    const breakpointValue = parseInt(breakpoints[breakpoint], 10);
    return `@media (max-width: ${breakpointValue - 0.1}px)`;
  },

  /**
   * Creates a media query for a specific range
   *
   * @param start - Start breakpoint key
   * @param end - End breakpoint key
   * @returns Media query string
   */
  between: (start: keyof typeof breakpoints, end: keyof typeof breakpoints) => {
    const endValue = parseInt(breakpoints[end], 10);
    return `@media (min-width: ${breakpoints[start]}) and (max-width: ${endValue - 0.1}px)`;
  },
};
