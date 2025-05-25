import { BaseServiceConfig } from '../base/base-service';

export const SPRING_SERVICE_CONFIG: BaseServiceConfig = {
  baseURL: process.env.NEXT_PUBLIC_SPRING_API_URL || 'http://localhost:8080/api',
  timeout: 30000,
  authType: 'bearer',
  headers: {
    'X-Client-Version': '1.0.0',
    'X-Service': 'crm-frontend',
  },
};
