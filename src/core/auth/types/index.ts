/**
 * Authentication Types
 * Central location for all authentication-related TypeScript types and interfaces
 */

export interface KeycloakTokenPayload {
  sub: string;
  realm_access?: { roles?: string[] };
  resource_access?: Record<string, { roles?: string[] }>;
  groups?: string[];
  roles?: string[]; // Sometimes roles are directly in the token
  authorities?: string[]; // Add authorities field for Keycloak tokens
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
  checkInterval?: number; // in milliseconds
  onSessionExpired?: () => void;
  onSessionRestored?: () => void;
  warningThreshold?: number; // minutes before expiry to show warning
  onSessionWarning?: (minutesLeft: number) => void;
  gracePeriod?: number; // minutes to wait after login before starting checks
  idleTimeout?: number; // minutes of inactivity before warnings can show
  autoRefreshOnActivity?: boolean; // auto-refresh session when user is active
}

export interface ActivityTrackerOptions {
  timeout?: number; // milliseconds of inactivity before considered idle
  events?: string[]; // DOM events to track for activity
  immediate?: boolean; // whether to start tracking immediately
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

// NextAuth module augmentation
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      // roles and groups removed from session to prevent size limits
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
    // roles and groups removed from JWT to prevent size limits
  }
}
