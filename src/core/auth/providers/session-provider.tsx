/**
 * Session Provider
 * Enhanced session provider with auth utilities
 */

'use client';

import { SessionProvider, useSession } from 'next-auth/react';
import type { SessionProviderProps } from '../types';

export function AppSessionProvider({ children, session }: SessionProviderProps) {
  return (
    <SessionProvider session={session} refetchInterval={0} refetchOnWindowFocus={false}>
      <div suppressHydrationWarning>{children}</div>
    </SessionProvider>
  );
}

export function useAuth() {
  const { data: session, status } = useSession();

  return {
    session,
    status,
    isLoading: status === 'loading',
  };
}
