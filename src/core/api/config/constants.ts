export const AUTH_TOKEN_KEY = process.env.NEXT_PUBLIC_AUTH_TOKEN_KEY || 'auth_token';
export const AUTH_REFRESH_TOKEN_KEY =
  process.env.NEXT_PUBLIC_AUTH_REFRESH_TOKEN_KEY || 'refresh_token';

export const SPRING_API_URL = process.env.NEXT_PUBLIC_SPRING_API_URL || 'https://localhost:8080';

export const KEYCLOAK_URL = process.env.NEXT_PUBLIC_KEYCLOAK_URL || 'http://localhost:9090';
export const KEYCLOAK_REALM = process.env.NEXT_PUBLIC_KEYCLOAK_REALM || 'crm';

export const REQUEST_TIMEOUT = 120000;
export const KEYCLOAK_REQUEST_TIMEOUT = 15000;

export const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  Accept: 'application/json',
};

export const SPRING_HEADERS = {
  ...DEFAULT_HEADERS,
  'X-Client-Version': '1.0.0',
  'X-Service': 'crm-frontend',
};

export const KEYCLOAK_HEADERS = {
  ...DEFAULT_HEADERS,
  'X-Keycloak-Client': 'crm-frontend',
};
