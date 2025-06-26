/**
 * Session Provider
 * Enhanced session provider with auth utilities
 */

'use client';

import { SessionProvider, useSession } from 'next-auth/react';
import type { Session } from 'next-auth';
import type { SessionProviderProps } from '../types';

export function AppSessionProvider({ children, session }: SessionProviderProps) {
  return <SessionProvider session={session}>{children}</SessionProvider>;
}

// Export useAuth hook for client components
export function useAuth() {
  const { data: session, status } = useSession();
  return {
    session,
    status,
    isLoading: status === 'loading',
  };
}
