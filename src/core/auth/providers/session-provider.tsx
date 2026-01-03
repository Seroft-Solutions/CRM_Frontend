/**
 * Session Provider
 * Enhanced session provider with auth utilities
 */

'use client';

import { SessionProvider, useSession } from 'next-auth/react';
import { useEffect } from 'react';
import type { SessionProviderProps } from '../types';

/**
 * Component that clears logout flag when user is authenticated
 * This prevents the flag from blocking access after a fresh login
 */
function LogoutFlagClearer() {
  const { status } = useSession();

  useEffect(() => {
    if (status === 'authenticated') {
      // Clear the logout flag when user is authenticated
      try {
        sessionStorage.removeItem('LOGOUT_IN_PROGRESS');
        sessionStorage.removeItem('LOGOUT_TIMESTAMP');
        document.cookie = 'LOGOUT_IN_PROGRESS=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      } catch (error) {
        console.error('Failed to clear logout flag:', error);
      }
    }
  }, [status]);

  return null;
}

export function AppSessionProvider({ children, session }: SessionProviderProps) {
  return (
    <SessionProvider session={session} refetchInterval={0} refetchOnWindowFocus={false}>
      <LogoutFlagClearer />
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
