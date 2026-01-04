/**
 * NextAuth Configuration
 * Clean, modular authentication setup using Keycloak
 *
 * @module core/auth/config
 */

import NextAuth from 'next-auth';
import { getKeycloakProvider } from './providers';
import { jwtCallback, sessionCallback, authorizedCallback } from './callbacks';
import { signOutEvent } from './events';
import { authLogger } from './logger';
import { SESSION_MAX_AGE } from './constants';

// Export type definitions
export * from './types';

/**
 * NextAuth configuration
 * Centralized authentication setup with Keycloak provider
 */
export const { handlers, signIn, signOut, auth } = NextAuth({
  // Authentication providers
  providers: [getKeycloakProvider()],

  // Session configuration
  session: {
    strategy: 'jwt',
    maxAge: SESSION_MAX_AGE,
  },

  // Custom pages
  pages: {
    error: '/auth/error',
  },

  // Logging configuration
  logger: authLogger,

  // Callback handlers
  callbacks: {
    jwt: jwtCallback,
    session: sessionCallback,
    authorized: authorizedCallback,
  },

  // Event handlers
  events: {
    signOut: signOutEvent,
  },

  // Trust host (for proxies/load balancers)
  trustHost: true,
});
