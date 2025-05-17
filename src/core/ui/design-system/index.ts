/**
 * Design system exports
 *
 * Exports all design system components, tokens, and foundations.
 */

// Export design tokens
export * from './tokens';

// Export design foundations
export * from './foundations';

// Export components (will be implemented later)
// export * from './components';

/**
 * Theme object that combines all design tokens and foundations
 */
import * as tokens from './tokens';
import * as foundations from './foundations';

export const theme = {
  ...tokens,
  ...foundations,
};
