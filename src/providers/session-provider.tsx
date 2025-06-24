'use client';

import { SessionProvider, useSession } from 'next-auth/react';
import type { Session } from 'next-auth';

interface AppSessionProviderProps {
  children: React.ReactNode;
  session?: Session | null;
}

export function AppSessionProvider({ children, session }: AppSessionProviderProps) {
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
