/**
 * Session Provider
 * Enhanced session provider with auth utilities
 */

'use client';

import { SessionProvider, useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import type { Session } from 'next-auth';
import type { SessionProviderProps } from '../types';

export function AppSessionProvider({ children, session }: SessionProviderProps) {
  const [mounted, setMounted] = useState(false);

  // Handle hydration mismatch by ensuring client-side mounting
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // During SSR or initial render, provide minimal structure
    return <div suppressHydrationWarning>{children}</div>;
  }

  return (
    <SessionProvider 
      session={session}
      // Prevent automatic session refresh during token issues
      refetchInterval={0}
      refetchOnWindowFocus={false}
    >
      {children}
    </SessionProvider>
  );
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
