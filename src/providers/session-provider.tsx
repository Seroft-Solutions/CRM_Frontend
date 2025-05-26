'use client';

import React, { createContext, useContext } from 'react';
import { SessionProvider, useSession } from 'next-auth/react';
import type { Session } from 'next-auth';

// Simple context for additional auth utilities
interface AuthContextValue {
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
  hasOrganization: (orgId: string) => boolean;
  getUserRoles: () => string[];
  getUserOrganizations: () => Array<{ name: string; id: string }>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
  session?: Session | null;
}

function AuthContextProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();

  const hasRole = (role: string): boolean => {
    return session?.user?.roles?.includes(role) ?? false;
  };

  const hasAnyRole = (roles: string[]): boolean => {
    return roles.some(role => session?.user?.roles?.includes(role)) ?? false;
  };

  const hasOrganization = (orgId: string): boolean => {
    return session?.user?.organizations?.some(org => org.id === orgId) ?? false;
  };

  const getUserRoles = (): string[] => {
    return session?.user?.roles ?? [];
  };

  const getUserOrganizations = (): Array<{ name: string; id: string }> => {
    return session?.user?.organizations ?? [];
  };

  const contextValue: AuthContextValue = {
    hasRole,
    hasAnyRole,
    hasOrganization,
    getUserRoles,
    getUserOrganizations,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function AppSessionProvider({ children, session }: AuthProviderProps) {
  return (
    <SessionProvider session={session}>
      <AuthContextProvider>
        {children}
      </AuthContextProvider>
    </SessionProvider>
  );
}

// Custom hooks for easier access to auth data
export function useAuth() {
  const context = useContext(AuthContext);
  const { data: session, status } = useSession();
  
  if (context === undefined) {
    throw new Error('useAuth must be used within AppSessionProvider');
  }
  
  return {
    session,
    status,
    isAuthenticated: status === 'authenticated',
    isLoading: status === 'loading',
    user: session?.user,
    error: session?.error,
    ...context,
  };
}

// Simplified hooks for common use cases
export function useUser() {
  const { data: session } = useSession();
  return session?.user ?? null;
}

export function useUserRoles() {
  const { data: session } = useSession();
  const roles = session?.user?.roles ?? [];
  
  return {
    roles,
    hasRole: (role: string) => roles.includes(role),
    hasAnyRole: (checkRoles: string[]) => checkRoles.some(role => roles.includes(role)),
    hasAllRoles: (checkRoles: string[]) => checkRoles.every(role => roles.includes(role)),
  };
}

export function useUserOrganizations() {
  const { data: session } = useSession();
  const organizations = session?.user?.organizations ?? [];
  
  return {
    organizations,
    currentOrganization: organizations.length > 0 ? organizations[0] : null, // Use first org as current
    hasOrganization: (orgId: string) => organizations.some(org => org.id === orgId),
    getOrganizationById: (id: string) => organizations.find(org => org.id === id) ?? null,
    getOrganizationByName: (name: string) => organizations.find(org => org.name === name) ?? null,
  };
}
