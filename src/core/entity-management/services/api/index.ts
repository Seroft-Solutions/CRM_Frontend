/**
 * Entity Management API Service Functions
 * Provides helpers for interacting with entity APIs
 */

import { BaseEntity, FormMode } from '@/features/core/tanstack-query-api';

/**
 * Current API service version
 */
export const API_SERVICE_VERSION = '1.0.0';

/**
 * Interface for entity data transformation
 */
export interface EntityDataTransformer<T = any> {
  /**
   * Transform data before sending to API
   * @param data Data to transform
   * @param mode Current form mode
   * @returns Transformed data
   */
  transformFormData?: (data: T, mode: FormMode) => any;
  
  /**
   * Transform data received from API
   * @param data Data from API
   * @returns Transformed data
   */
  transformResponseData?: (data: any) => T;
}

/**
 * Format entity endpoint URL with path parameters
 * 
 * @param url The URL template with path parameters (e.g., "/api/users/{id}")
 * @param params The parameters to substitute
 * @returns Formatted URL with parameters replaced
 */
export function formatEntityUrl(url: string, params: Record<string, string | number>): string {
  let formattedUrl = url;
  
  // Replace all placeholders in format {paramName}
  Object.entries(params).forEach(([key, value]) => {
    const placeholder = `{${key}}`;
    if (formattedUrl.includes(placeholder)) {
      formattedUrl = formattedUrl.replace(placeholder, encodeURIComponent(String(value)));
    }
  });
  
  return formattedUrl;
}

/**
 * Build query string from parameters
 * 
 * @param params Object containing query parameters
 * @returns Formatted query string starting with "?"
 */
export function buildQueryString(params: Record<string, any>): string {
  const validParams = Object.entries(params)
    .filter(([_, value]) => value !== undefined && value !== null && value !== '')
    .reduce((acc, [key, value]) => {
      acc[key] = value;
      return acc;
    }, {} as Record<string, any>);
  
  if (Object.keys(validParams).length === 0) {
    return '';
  }
  
  const searchParams = new URLSearchParams();
  
  Object.entries(validParams).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach(item => searchParams.append(`${key}[]`, String(item)));
    } else {
      searchParams.append(key, String(value));
    }
  });
  
  return `?${searchParams.toString()}`;
}

/**
 * Standard entity filter schema
 */
export interface EntityFilter {
  page?: number;
  size?: number;
  sort?: string;
  direction?: 'asc' | 'desc';
  search?: string;
  [key: string]: any;
}

/**
 * Build URL with filter parameters
 * 
 * @param baseUrl Base URL without query parameters
 * @param filter Filter object
 * @returns URL with query parameters
 */
export function buildEntityUrl(baseUrl: string, filter?: EntityFilter): string {
  if (!filter || Object.keys(filter).length === 0) {
    return baseUrl;
  }
  
  return `${baseUrl}${buildQueryString(filter)}`;
}
