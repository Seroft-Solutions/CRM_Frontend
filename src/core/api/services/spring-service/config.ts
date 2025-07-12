import { BaseServiceConfig } from "@/core/api/services/base/base-service";

export const SPRING_SERVICE_CONFIG: BaseServiceConfig = {
  baseURL: process.env.NEXT_PUBLIC_SPRING_API_URL || 'https://api.dev.crmcup.com',
  timeout: 30000,
  authType: 'bearer',
  headers: {
    'X-Client-Version': '1.0.0',
    'X-Service': 'crm-frontend',
  },
};

// Extended timeout configuration for long-running operations like organization setup
export const SPRING_SERVICE_LONG_RUNNING_CONFIG: BaseServiceConfig = {
  baseURL: process.env.NEXT_PUBLIC_SPRING_API_URL || 'https://api.dev.crmcup.com',
  timeout: 120000, // 2 minutes for schema setup operations
  authType: 'bearer',
  headers: {
    'X-Client-Version': '1.0.0',
    'X-Service': 'crm-frontend',
  },
};
