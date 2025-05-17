'use client';

import {
  QueryClient,
  QueryClientProvider as TanstackQueryClientProvider,
  QueryClientProviderProps as TanstackQueryClientProviderProps,
} from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState, type ReactNode } from 'react';

interface QueryClientProviderProps {
  children: ReactNode;
  defaultStaleTime?: number;
  defaultGcTime?: number;
  includeDevtools?: boolean;
}

export function QueryClientProvider({
  children,
  defaultStaleTime = 0,
  defaultGcTime = 5 * 60 * 1000, // 5 minutes
  includeDevtools = false,
}: QueryClientProviderProps) {
  // Create a new QueryClient instance for each user session
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: defaultStaleTime,
            gcTime: defaultGcTime,
            retry: 1,
            refetchOnWindowFocus: true,
          },
          mutations: {
            retry: 0,
          },
        },
      })
  );

  return (
    <TanstackQueryClientProvider client={queryClient}>
      {children}
      {includeDevtools && <ReactQueryDevtools initialIsOpen={false} />}
    </TanstackQueryClientProvider>
  );
}
