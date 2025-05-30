/**
 * Generic API response wrapper
 * @template T The type of data returned by the API
 */
export interface ApiResponse<T = unknown> {
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
  data?: unknown;
  params?: Record<string, string | number | boolean | null | Array<string | number | boolean>>;
  signal?: AbortSignal;
  responseType?: 'arraybuffer' | 'blob' | 'document' | 'json' | 'text' | 'stream';
}
