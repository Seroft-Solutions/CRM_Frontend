'use client';

import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider as TanstackQueryClientProvider,
} from '@tanstack/react-query';
import { type ReactNode, useState } from 'react';

interface QueryClientProviderProps {
  children: ReactNode;
  defaultStaleTime?: number;
  defaultGcTime?: number;
  includeDevtools?: boolean;
}

export function QueryClientProvider({
  children,
  defaultStaleTime = 1 * 60 * 1000,
  defaultGcTime = 10 * 60 * 1000,
}: QueryClientProviderProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: defaultStaleTime,
            gcTime: defaultGcTime,
            retry: (failureCount, error: any) => {
              if (error?.status === 401 || error?.status === 403 || error?.status === 404) {
                return false;
              }

              return failureCount < 3;
            },
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
            refetchOnWindowFocus: true,
            refetchOnReconnect: true,
            refetchInterval: false,
          },
          mutations: {
            retry: (failureCount, error: any) => {
              if (error?.status === 401 || error?.status === 403 || error?.status === 404) {
                return false;
              }
              return failureCount < 1;
            },
          },
        },
        mutationCache: new MutationCache({
          onError: (error: any) => {
            if (error?.status === 401) {
              console.warn('Authentication expired during mutation - continuing without logout');
            }
          },
        }),
        queryCache: new QueryCache({
          onError: (error: any) => {
            if (error?.status === 401) {
              console.warn('Authentication expired during query - continuing without logout');
            }
          },
        }),
      })
  );

  return <TanstackQueryClientProvider client={queryClient}>{children}</TanstackQueryClientProvider>;
}
