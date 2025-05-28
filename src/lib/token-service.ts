/**
 * Token Service for Database Session Strategy
 * 
 * This service provides utilities for token management when using
 * database-backed sessions with NextAuth v5 and Prisma.
 */

export interface TokenInfo {
  accessToken: string;
  userId: string;
  userEmail?: string;
  organizations?: Array<{ id: string; name: string }>;
  expiresAt: number;
}

export interface SessionInfo {
  user: {
    id: string;
    name?: string;
    email?: string;
    image?: string;
    roles: string[];
    organizations: Array<{ id: string; name: string }>;
    keycloakId?: string;
  };
  expires: string;
}

/**
 * Token Service Class for managing authentication tokens with database sessions
 */
export class TokenService {
  private static instance: TokenService;
  private tokenCache: Map<string, { token: string; expiry: number }> = new Map();

  private constructor() {}

  static getInstance(): TokenService {
    if (!TokenService.instance) {
      TokenService.instance = new TokenService();
    }
    return TokenService.instance;
  }

  /**
   * Get access token for API calls
   */
  async getAccessToken(): Promise<string | null> {
    try {
      if (typeof window === 'undefined') {
        // Server-side: not available in database session strategy
        return null;
      }

      // Check cache first
      const cached = this.tokenCache.get('access_token');
      if (cached && Date.now() < cached.expiry) {
        return cached.token;
      }

      // Fetch from API
      const response = await fetch('/api/auth/token', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          await this.redirectToLogin();
        }
        return null;
      }

      const tokenInfo: TokenInfo = await response.json();
      
      // Cache the token
      this.tokenCache.set('access_token', {
        token: tokenInfo.accessToken,
        expiry: tokenInfo.expiresAt || Date.now() + (45 * 60 * 1000) // 45 minutes default
      });

      return tokenInfo.accessToken;
    } catch (error) {
      console.error('Error getting access token:', error);
      return null;
    }
  }

  /**
   * Get full token information including user details
   */
  async getTokenInfo(): Promise<TokenInfo | null> {
    try {
      if (typeof window === 'undefined') {
        return null;
      }

      const response = await fetch('/api/auth/token', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting token info:', error);
      return null;
    }
  }

  /**
   * Get current session information
   */
  async getSession(): Promise<SessionInfo | null> {
    try {
      if (typeof window === 'undefined') {
        return null;
      }

      const response = await fetch('/api/auth/session', {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        return null;
      }

      const session = await response.json();
      return session || null;
    } catch (error) {
      console.error('Error getting session:', error);
      return null;
    }
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const session = await this.getSession();
    return !!session?.user;
  }

  /**
   * Get user's organizations for tenant context
   */
  async getUserOrganizations(): Promise<Array<{ id: string; name: string }> | null> {
    const session = await this.getSession();
    return session?.user?.organizations || null;
  }

  /**
   * Get user's roles
   */
  async getUserRoles(): Promise<string[]> {
    const session = await this.getSession();
    return session?.user?.roles || [];
  }

  /**
   * Get primary organization (first one) for tenant context
   */
  async getPrimaryOrganization(): Promise<{ id: string; name: string } | null> {
    const organizations = await this.getUserOrganizations();
    return organizations && organizations.length > 0 ? organizations[0] : null;
  }

  /**
   * Check if user has specific role
   */
  async hasRole(role: string): Promise<boolean> {
    const roles = await this.getUserRoles();
    return roles.includes(role);
  }

  /**
   * Check if user has any of the specified roles
   */
  async hasAnyRole(roles: string[]): Promise<boolean> {
    const userRoles = await this.getUserRoles();
    return roles.some(role => userRoles.includes(role));
  }

  /**
   * Get user information
   */
  async getUserInfo() {
    const session = await this.getSession();
    return session?.user || null;
  }

  /**
   * Clear token cache
   */
  clearCache(): void {
    this.tokenCache.clear();
  }

  /**
   * Sign out user
   */
  async signOut(): Promise<void> {
    try {
      this.clearCache();
      
      if (typeof window !== 'undefined') {
        // Use NextAuth signOut
        const { signOut } = await import('next-auth/react');
        await signOut({ 
          callbackUrl: '/',
          redirect: true 
        });
      }
    } catch (error) {
      console.error('Error signing out:', error);
      // Fallback redirect
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/signin';
      }
    }
  }

  /**
   * Redirect to login page
   */
  private async redirectToLogin(): Promise<void> {
    if (typeof window !== 'undefined') {
      this.clearCache();
      window.location.href = '/auth/signin';
    }
  }

  /**
   * Create authorization header for API requests
   */
  async createAuthHeader(): Promise<Record<string, string> | null> {
    const token = await this.getAccessToken();
    if (!token) return null;

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${token}`
    };

    // Add tenant context if available
    const primaryOrg = await this.getPrimaryOrganization();
    if (primaryOrg) {
      headers['X-Tenant-ID'] = primaryOrg.id;
      headers['X-Organization-ID'] = primaryOrg.id;
    }

    return headers;
  }

  /**
   * Make authenticated request with automatic token handling
   */
  async authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
    const authHeaders = await this.createAuthHeader();
    
    const requestOptions: RequestInit = {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
        ...options.headers,
      },
    };

    let response = await fetch(url, requestOptions);

    // If unauthorized, try to refresh token and retry once
    if (response.status === 401 && !options.headers?.['X-Retry']) {
      this.clearCache();
      const newAuthHeaders = await this.createAuthHeader();
      
      if (newAuthHeaders) {
        const retryOptions: RequestInit = {
          ...requestOptions,
          headers: {
            ...requestOptions.headers,
            ...newAuthHeaders,
            'X-Retry': 'true', // Prevent infinite retries
          },
        };
        
        response = await fetch(url, retryOptions);
      }
    }

    // If still unauthorized, redirect to login
    if (response.status === 401) {
      await this.redirectToLogin();
    }

    return response;
  }
}

// Export singleton instance
export const tokenService = TokenService.getInstance();

// Convenience functions
export const getAccessToken = () => tokenService.getAccessToken();
export const getSession = () => tokenService.getSession();
export const isAuthenticated = () => tokenService.isAuthenticated();
export const getUserOrganizations = () => tokenService.getUserOrganizations();
export const getUserRoles = () => tokenService.getUserRoles();
export const hasRole = (role: string) => tokenService.hasRole(role);
export const hasAnyRole = (roles: string[]) => tokenService.hasAnyRole(roles);
export const signOut = () => tokenService.signOut();
export const createAuthHeader = () => tokenService.createAuthHeader();
export const authenticatedFetch = (url: string, options?: RequestInit) => 
  tokenService.authenticatedFetch(url, options);

/**
 * React hook for token management (if using in React components)
 */
export function useTokenService() {
  return {
    getAccessToken: tokenService.getAccessToken.bind(tokenService),
    getSession: tokenService.getSession.bind(tokenService),
    isAuthenticated: tokenService.isAuthenticated.bind(tokenService),
    getUserOrganizations: tokenService.getUserOrganizations.bind(tokenService),
    getUserRoles: tokenService.getUserRoles.bind(tokenService),
    hasRole: tokenService.hasRole.bind(tokenService),
    hasAnyRole: tokenService.hasAnyRole.bind(tokenService),
    signOut: tokenService.signOut.bind(tokenService),
    createAuthHeader: tokenService.createAuthHeader.bind(tokenService),
    authenticatedFetch: tokenService.authenticatedFetch.bind(tokenService),
  };
}

export default tokenService;
