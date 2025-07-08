'use client';

import {
  QueryClient,
  QueryClientProvider as TanstackQueryClientProvider,
  QueryCache,
  MutationCache,
} from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { signOut } from 'next-auth/react';

interface QueryClientProviderProps {
  children: ReactNode;
  defaultStaleTime?: number;
  defaultGcTime?: number;
  includeDevtools?: boolean;
}

export function QueryClientProvider({
  children,
  defaultStaleTime = 1 * 60 * 1000, // 1 minute default
  defaultGcTime = 10 * 60 * 1000, // 10 minutes
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
              // Retry up to 3 times for other errors
              return failureCount < 3;
            },
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
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
            // Handle 401 errors globally for mutations
            if (error?.status === 401) {
              console.warn('Authentication expired during mutation, signing out...');
              signOut({ callbackUrl: '/auth/signin' });
            }
          },
        }),
        queryCache: new QueryCache({
          onError: (error: any) => {
            // Handle 401 errors globally for queries
            if (error?.status === 401) {
              console.warn('Authentication expired during query, signing out...');
              signOut({ callbackUrl: '/auth/signin' });
            }
          },
        }),
      })
  );

  return <TanstackQueryClientProvider client={queryClient}>{children}</TanstackQueryClientProvider>;
}
