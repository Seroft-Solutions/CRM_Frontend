import { BaseServiceConfig } from "@/core/api/services/base/base-service";

/**
 * Keycloak Service Configuration
 *
 * This configuration supports both regular Keycloak operations and admin operations.
 * The service will automatically handle authentication based on the operation type.
 */
export const KEYCLOAK_SERVICE_CONFIG: BaseServiceConfig = {
  baseURL: process.env.AUTH_KEYCLOAK_ISSUER?.replace('/realms/crm', '') || 'http://localhost:9080',
  timeout: 30000, // Increased for admin operations
  authType: 'bearer', // Uses bearer token authentication
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
};

/**
 * Default realm for operations
 * Extracted from the AUTH_KEYCLOAK_ISSUER environment variable
 */
export const KEYCLOAK_REALM = (() => {
  const issuer = process.env.AUTH_KEYCLOAK_ISSUER || 'http://localhost:9080/realms/crm';
  const match = issuer.match(/\/realms\/([^/?]+)/);
  return match ? match[1] : 'crm';
})();

/**
 * Admin credentials configuration
 * For admin operations, we use the admin-cli client which is pre-configured in Keycloak
 * for direct access grants (password flow)
 */
export const KEYCLOAK_ADMIN_CONFIG = {
  username: process.env.KEYCLOAK_ADMIN_USERNAME || 'admin',
  password: process.env.KEYCLOAK_ADMIN_PASSWORD || 'admin',
  // Use admin-cli client for admin operations (no client secret required)
  clientId: 'admin-cli',
  // Fallback to configured client if admin-cli doesn't work
  fallbackClientId: process.env.AUTH_KEYCLOAK_ID || 'web_app',
  fallbackClientSecret: process.env.AUTH_KEYCLOAK_SECRET,
};

/**
 * Keycloak endpoints configuration
 */
export const KEYCLOAK_ENDPOINTS = {
  token: `/realms/master/protocol/openid-connect/token`, // Admin auth is against master realm
  userInfo: `/realms/${KEYCLOAK_REALM}/protocol/openid-connect/userinfo`,
  admin: `/admin/realms/${KEYCLOAK_REALM}`,
} as const;

/**
 * Debug configuration
 */
export const KEYCLOAK_DEBUG = {
  enabled: process.env.NODE_ENV === 'development' || process.env.AUTH_DEBUG === 'true',
  logRequests: true,
  logResponses: false, // Set to true for detailed debugging (may log sensitive data)
};
