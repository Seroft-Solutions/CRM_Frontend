'use client';

import {
  QueryClient,
  QueryClientProvider as TanstackQueryClientProvider,
  QueryCache,
  MutationCache,
} from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { QUERY_CLIENT_CONFIG } from '../config/api-config';

interface QueryClientProviderProps {
  children: ReactNode;
  defaultStaleTime?: number;
  defaultGcTime?: number;
}

export function QueryClientProvider({
  children,
  defaultStaleTime = QUERY_CLIENT_CONFIG.defaultStaleTime,
  defaultGcTime = QUERY_CLIENT_CONFIG.defaultGcTime,
}: QueryClientProviderProps) {
  // Create a new QueryClient instance for each user session
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: defaultStaleTime,
            gcTime: defaultGcTime,
            retry: (failureCount, error: any) => {
              // Don't retry on 401, 403, or 404 errors
              if (error?.status === 401 || error?.status === 403 || error?.status === 404) {
                return false;
              }
              return failureCount < QUERY_CLIENT_CONFIG.retryAttempts;
            },
            retryDelay: QUERY_CLIENT_CONFIG.retryDelay,
            refetchOnWindowFocus: true,
            refetchOnReconnect: true,
            refetchInterval: false, // Disable automatic interval refetching by default
          },
          mutations: {
            retry: (failureCount, error: any) => {
              // Don't retry mutations on 401, 403, or 404 errors
              if (error?.status === 401 || error?.status === 403 || error?.status === 404) {
                return false;
              }
              return failureCount < 1;
            },
          },
        },
        mutationCache: new MutationCache({
          onError: (error: any) => {
            // Handle 401 errors - just log, no automatic logout
            if (error?.status === 401) {
              console.warn('Authentication expired during mutation - continuing without logout');
            }
          },
        }),
        queryCache: new QueryCache({
          onError: (error: any) => {
            // Handle 401 errors - just log, no automatic logout  
            if (error?.status === 401) {
              console.warn('Authentication expired during query - continuing without logout');
            }
          },
        }),
      })
  );

  return <TanstackQueryClientProvider client={queryClient}>{children}</TanstackQueryClientProvider>;
}
