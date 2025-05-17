/**
 * Authentication module exports
 *
 * Single source of truth for authentication functionality.
 * Now leveraging the Orval generated API clients directly.
 */

// Re-export providers and hooks
export { AuthProvider, useAuth, useRBAC } from './providers';

// Re-export services
export { createTokenService, type TokenService, type TokenServiceConfig } from './services';

// Re-export constants if needed
export * from './constants';
