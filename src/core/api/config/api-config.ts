/**
 * Centralized API Configuration
 * Single source of truth for all API-related settings
 */

// Base URLs
export const API_BASE_URLS = {
  spring: process.env.NEXT_PUBLIC_SPRING_API_URL || 'https://api.dev.crmcup.com',
  keycloak: process.env.AUTH_KEYCLOAK_ISSUER?.replace('/realms/crm', '') || 'http://localhost:9080',
} as const;

// Timeout configurations
export const API_TIMEOUTS = {
  default: 30000,
  shortTimeout: 15000,
  longRunning: 120000, // For operations like schema setup
} as const;

// Common headers
export const API_HEADERS = {
  default: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  spring: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Client-Version': '1.0.0',
    'X-Service': 'crm-frontend',
  },
  keycloak: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
} as const;

// Query client defaults
export const QUERY_CLIENT_CONFIG = {
  defaultStaleTime: 1 * 60 * 1000, // 1 minute
  defaultGcTime: 10 * 60 * 1000, // 10 minutes
  retryAttempts: 3,
  retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
} as const;

// Auth configuration
export const AUTH_CONFIG = {
  tokenKeys: {
    access: process.env.NEXT_PUBLIC_AUTH_TOKEN_KEY || 'auth_token',
    refresh: process.env.NEXT_PUBLIC_AUTH_REFRESH_TOKEN_KEY || 'refresh_token',
  },
  keycloak: {
    realm: (() => {
      const issuer = process.env.AUTH_KEYCLOAK_ISSUER || 'http://localhost:9080/realms/crm';
      const match = issuer.match(/\/realms\/([^/?]+)/);
      return match ? match[1] : 'crm';
    })(),
    admin: {
      username: process.env.KEYCLOAK_ADMIN_USERNAME || 'admin',
      password: process.env.KEYCLOAK_ADMIN_PASSWORD || 'admin',
      clientId: 'admin-cli',
      fallbackClientId: process.env.AUTH_KEYCLOAK_ID || 'web_app',
      fallbackClientSecret: process.env.AUTH_KEYCLOAK_SECRET,
    },
  },
} as const;

// Environment flags
export const ENV_FLAGS = {
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  enableDebugAuth: process.env.AUTH_DEBUG === 'true',
} as const;

// Long-running operation detection
export const LONG_RUNNING_OPERATIONS = [
  '/tenants/organizations/setup',
  '/setup-progress',
  '/schemas/',
] as const;

export function isLongRunningOperation(url: string): boolean {
  return LONG_RUNNING_OPERATIONS.some(pattern => 
    url.includes(pattern) && (pattern === '/schemas/' ? url.includes('/setup') : true)
  );
}