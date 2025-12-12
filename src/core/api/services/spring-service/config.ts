import { BaseServiceConfig } from '@/core/api/services/base/base-service';
import { REQUEST_TIMEOUT } from '@/core/api/config/constants';

export const SPRING_SERVICE_CONFIG: BaseServiceConfig = {
  baseURL: process.env.NEXT_PUBLIC_SPRING_API_URL || 'https://localhost:8080',
  timeout: REQUEST_TIMEOUT,
  authType: 'bearer',
  headers: {
    'X-Client-Version': '1.0.0',
    'X-Service': 'crm-frontend',
  },
};

export const SPRING_SERVICE_LONG_RUNNING_CONFIG: BaseServiceConfig = {
  baseURL: process.env.NEXT_PUBLIC_SPRING_API_URL || 'https://localhost:8080',
  timeout: REQUEST_TIMEOUT,
  authType: 'bearer',
  headers: {
    'X-Client-Version': '1.0.0',
    'X-Service': 'crm-frontend',
  },
};
