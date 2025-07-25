import { BaseServiceConfig } from "@/core/api/services/base/base-service";
import { API_BASE_URLS, API_TIMEOUTS, API_HEADERS, AUTH_CONFIG, ENV_FLAGS } from "../../config/api-config";

/**
 * Keycloak Service Configuration
 * This configuration supports both regular Keycloak operations and admin operations.
 */
export const KEYCLOAK_SERVICE_CONFIG: BaseServiceConfig = {
  baseURL: API_BASE_URLS.keycloak,
  timeout: API_TIMEOUTS.default,
  authType: 'bearer',
  headers: API_HEADERS.keycloak,
};

/**
 * Default realm for operations
 */
export const KEYCLOAK_REALM = AUTH_CONFIG.keycloak.realm;

/**
 * Admin credentials configuration
 */
export const KEYCLOAK_ADMIN_CONFIG = AUTH_CONFIG.keycloak.admin;

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
  enabled: ENV_FLAGS.isDevelopment || ENV_FLAGS.enableDebugAuth,
  logRequests: ENV_FLAGS.isDevelopment,
  logResponses: false, // Disabled to prevent sensitive data logging
};
