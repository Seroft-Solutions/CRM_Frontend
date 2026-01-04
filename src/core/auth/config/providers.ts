/**
 * NextAuth Provider Configuration
 * Keycloak provider setup
 */

import Keycloak from 'next-auth/providers/keycloak';

/**
 * Get Keycloak provider configuration
 */
export function getKeycloakProvider() {
  return Keycloak({
    clientId: process.env.AUTH_KEYCLOAK_ID!,
    clientSecret: process.env.AUTH_KEYCLOAK_SECRET!,
    issuer: process.env.AUTH_KEYCLOAK_ISSUER!,
  });
}
