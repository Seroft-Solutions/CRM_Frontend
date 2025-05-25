export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  status: number;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

export interface ErrorResponse {
  message: string;
  status: number;
  error: string;
  timestamp: string;
  path: string;
}

// Common service request config interface for Orval mutators
export interface ServiceRequestConfig {
  url: string;
  method?: string;
  headers?: Record<string, string>;
  data?: any;
  params?: Record<string, any>;
  signal?: AbortSignal;
}
