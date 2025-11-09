/**
 * Authentication Types
 * Central location for all authentication-related TypeScript types and interfaces
 */

export interface KeycloakTokenPayload {
  sub: string;
  realm_access?: { roles?: string[] };
  resource_access?: Record<string, { roles?: string[] }>;
  groups?: string[];
  roles?: string[];
  authorities?: string[];
  exp: number;
  iat: number;
  [key: string]: any;
}

export interface TokenRefreshResult {
  success: boolean;
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
  error?: string;
}

export interface SessionMonitorOptions {
  checkInterval?: number;
  onSessionExpired?: () => void;
  onSessionRestored?: () => void;
  warningThreshold?: number;
  onSessionWarning?: (minutesLeft: number) => void;
  gracePeriod?: number;
  idleTimeout?: number;
  autoRefreshOnActivity?: boolean;
}

export interface ActivityTrackerOptions {
  timeout?: number;
  events?: string[];
  immediate?: boolean;
}

export interface AuthConfig {
  keycloak: {
    issuer: string;
    clientId: string;
    clientSecret: string;
  };
  session: {
    strategy: 'jwt';
    maxAge: number;
  };
  callbacks: {
    jwt: any;
    session: any;
    authorized: any;
  };
  events: {
    signOut: any;
  };
}

export interface PermissionGuardProps {
  children: React.ReactNode;
  requiredPermission: string;
  fallback?: React.ReactNode;
  showUnauthorizedPage?: boolean;
  unauthorizedTitle?: string;
  unauthorizedDescription?: string;
}

export interface SessionProviderProps {
  children: React.ReactNode;
  session?: any;
}

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
    access_token?: string;
    refresh_token?: string;
  }

  interface JWT {
    id_token?: string;
    access_token?: string;
    refresh_token?: string;
    expires_at?: number;
    error?: string;
  }
}
