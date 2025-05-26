import { BaseServiceConfig } from '../base/base-service';

export const KEYCLOAK_SERVICE_CONFIG: BaseServiceConfig = {
  baseURL: process.env.NEXT_PUBLIC_KEYCLOAK_URL || 'http://localhost:9080/auth',
  timeout: 15000,
  authType: 'bearer', // Could be 'client-credentials' for admin operations
  headers: {
    'X-Keycloak-Client': 'crm-frontend',
  },
};

export const KEYCLOAK_REALM = process.env.NEXT_PUBLIC_KEYCLOAK_REALM || 'crm';
