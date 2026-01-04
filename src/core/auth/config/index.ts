/**
 * Authentication Configuration Module
 * Centralized exports for all auth configuration
 *
 * @module core/auth/config
 */

// Main NextAuth configuration
export { handlers, signIn, signOut, auth } from './nextauth';

// Type definitions
export type * from './types';

// Constants
export * from './constants';

// Utilities
export * from './token-validation';

export * from './protected-routes';

// Services
export { refreshAccessToken } from './token-refresh';

export { refreshTokenWithKeycloak, logoutFromKeycloak } from './keycloak-service';

// State management
export { refreshTracker } from './refresh-tracker';
