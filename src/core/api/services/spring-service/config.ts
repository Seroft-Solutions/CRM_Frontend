import { BaseServiceConfig } from "@/core/api/services/base/base-service";
import { API_BASE_URLS, API_TIMEOUTS, API_HEADERS } from "../../config/api-config";

export const SPRING_SERVICE_CONFIG: BaseServiceConfig = {
  baseURL: API_BASE_URLS.spring,
  timeout: API_TIMEOUTS.default,
  authType: 'bearer',
  headers: API_HEADERS.spring,
};

// Extended timeout configuration for long-running operations like organization setup
export const SPRING_SERVICE_LONG_RUNNING_CONFIG: BaseServiceConfig = {
  baseURL: API_BASE_URLS.spring,
  timeout: API_TIMEOUTS.longRunning,
  authType: 'bearer',
  headers: API_HEADERS.spring,
};
