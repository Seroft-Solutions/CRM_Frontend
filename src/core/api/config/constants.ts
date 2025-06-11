// Authentication token keys
export const AUTH_TOKEN_KEY = process.env.NEXT_PUBLIC_AUTH_TOKEN_KEY || 'auth_token';
export const AUTH_REFRESH_TOKEN_KEY =
  process.env.NEXT_PUBLIC_AUTH_REFRESH_TOKEN_KEY || 'refresh_token';

// Spring API configuration
export const SPRING_API_URL = process.env.NEXT_PUBLIC_SPRING_API_URL || 'https://api.dev.crmcup.com';

// Keycloak API configuration
export const KEYCLOAK_URL = process.env.NEXT_PUBLIC_KEYCLOAK_URL || 'http://localhost:8080/auth';
export const KEYCLOAK_REALM = process.env.NEXT_PUBLIC_KEYCLOAK_REALM || 'crm';

// Request timeout in milliseconds
export const REQUEST_TIMEOUT = 30000;
export const KEYCLOAK_REQUEST_TIMEOUT = 15000; // Shorter timeout for auth operations

// Default headers
export const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  Accept: 'application/json',
};

// Service-specific headers
export const SPRING_HEADERS = {
  ...DEFAULT_HEADERS,
  'X-Client-Version': '1.0.0',
  'X-Service': 'crm-frontend',
};

export const KEYCLOAK_HEADERS = {
  ...DEFAULT_HEADERS,
  'X-Keycloak-Client': 'crm-frontend',
};
