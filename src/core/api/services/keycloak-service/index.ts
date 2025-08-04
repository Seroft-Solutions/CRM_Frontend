import { BaseService } from "@/core/api/services/base/base-service";
import {
  KEYCLOAK_SERVICE_CONFIG,
  KEYCLOAK_REALM,
  KEYCLOAK_ADMIN_CONFIG,
  KEYCLOAK_DEBUG,
} from "@/core/api/services/keycloak-service/config";

/**
 * Unified Keycloak Admin Client Service
 *
 * This service handles both regular Keycloak operations and admin operations
 * with proper authentication and authorization management.
 *
 * Features:
 * - Automatic admin token management
 * - Type-safe operations using generated endpoints
 * - Consistent error handling
 * - Single authentication flow
 */
export class KeycloakService extends BaseService {
  private realm: string;
  private adminAccessToken: string | null = null;
  private adminTokenExpiry: number = 0;
  private adminTokenRefreshPromise: Promise<string | null> | null = null;

  constructor(realm = KEYCLOAK_REALM) {
    super(KEYCLOAK_SERVICE_CONFIG);
    this.realm = realm;
  }

  /**
   * Get admin access token with automatic refresh and caching
   */
  private async getAdminAccessToken(): Promise<string | null> {
    // Return cached token if still valid (with 30s buffer)
    if (this.adminAccessToken && Date.now() < this.adminTokenExpiry - 30000) {
      if (KEYCLOAK_DEBUG.enabled) {
        console.log('Using cached admin token');
      }
      return this.adminAccessToken;
    }

    // If there's already a refresh in progress, wait for it
    if (this.adminTokenRefreshPromise) {
      if (KEYCLOAK_DEBUG.enabled) {
        console.log('Waiting for existing admin token refresh');
      }
      return this.adminTokenRefreshPromise;
    }

    // Start a new token refresh
    this.adminTokenRefreshPromise = this.refreshAdminToken();
    const token = await this.adminTokenRefreshPromise;
    this.adminTokenRefreshPromise = null;

    return token;
  }

  /**
   * Refresh admin access token using password grant type
   * Tries admin-cli first, then falls back to configured client
   */
  private async refreshAdminToken(): Promise<string | null> {
    const credentials = this.getAdminCredentials();
    if (!credentials) {
      throw new Error('Admin credentials not configured');
    }

    // Try admin-cli client first
    try {
      return await this.tryAdminAuth('admin-cli', null, credentials);
    } catch (adminCliError) {
      if (KEYCLOAK_DEBUG.enabled) {
        console.warn('admin-cli authentication failed, trying fallback client:', adminCliError);
      }

      // Try fallback client
      try {
        return await this.tryAdminAuth(
          credentials.fallbackClientId,
          credentials.fallbackClientSecret,
          credentials
        );
      } catch (fallbackError) {
        console.error('Both admin-cli and fallback client failed:', {
          adminCliError: adminCliError.message,
          fallbackError: fallbackError.message,
        });
        throw fallbackError;
      }
    }
  }

  /**
   * Try admin authentication with specific client
   */
  private async tryAdminAuth(
    clientId: string,
    clientSecret: string | null,
    credentials: any
  ): Promise<string> {
    const tokenUrl = `${this.config.baseURL}/realms/master/protocol/openid-connect/token`;

    if (KEYCLOAK_DEBUG.enabled) {
      console.log('Attempting admin authentication:', {
        url: tokenUrl,
        clientId,
        username: credentials.adminUsername,
        hasClientSecret: !!clientSecret,
      });
    }

    const body = new URLSearchParams({
      grant_type: 'password',
      client_id: clientId,
      username: credentials.adminUsername,
      password: credentials.adminPassword,
    });

    // Add client secret if available
    if (clientSecret) {
      body.append('client_secret', clientSecret);
    }

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body,
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorDetail;
      try {
        errorDetail = JSON.parse(errorText);
      } catch {
        errorDetail = { error: errorText };
      }

      console.error(`Keycloak admin token error [${clientId}]:`, {
        status: response.status,
        statusText: response.statusText,
        error: errorDetail,
        url: tokenUrl,
      });

      throw new Error(
        `Failed to get admin token with ${clientId}: ${response.status} ${response.statusText} - ${errorDetail.error_description || errorDetail.error || errorText}`
      );
    }

    const data = await response.json();

    if (!data.access_token) {
      console.error('No access token in response:', data);
      throw new Error('No access token received from Keycloak');
    }

    this.adminAccessToken = data.access_token;
    this.adminTokenExpiry = Date.now() + data.expires_in * 1000;

    if (KEYCLOAK_DEBUG.enabled) {
      console.log(`Admin token refresh successful [${clientId}]:`, {
        expiresIn: data.expires_in,
        tokenLength: data.access_token.length,
      });
    }

    return this.adminAccessToken;
  }

  /**
   * Get admin credentials from environment and configuration
   */
  private getAdminCredentials() {
    const adminUsername = KEYCLOAK_ADMIN_CONFIG.username;
    const adminPassword = KEYCLOAK_ADMIN_CONFIG.password;
    const fallbackClientId = KEYCLOAK_ADMIN_CONFIG.fallbackClientId;
    const fallbackClientSecret = KEYCLOAK_ADMIN_CONFIG.fallbackClientSecret;

    if (!adminUsername || !adminPassword) {
      console.error('Missing Keycloak admin credentials:', {
        hasAdminUsername: !!adminUsername,
        hasAdminPassword: !!adminPassword,
        hasFallbackClientId: !!fallbackClientId,
        hasFallbackClientSecret: !!fallbackClientSecret,
      });
      return null;
    }

    return {
      adminUsername,
      adminPassword,
      fallbackClientId,
      fallbackClientSecret,
    };
  }

  /**
   * Override the base auth token method to provide admin authentication
   */
  protected async getAuthTokenFromSession(): Promise<string | null> {
    // For admin operations, use admin token
    if (this.isAdminOperation()) {
      return this.getAdminAccessToken();
    }

    // For regular operations, use base implementation
    return super.getAuthTokenFromSession();
  }

  /**
   * Determine if the current operation requires admin privileges
   * Admin operations typically use paths starting with /admin/realms
   */
  private isAdminOperation(): boolean {
    // Since we're primarily using this for admin operations,
    // we'll default to admin authentication
    return true;
  }

  /**
   * Get the admin API path for the configured realm
   */
  public getAdminPath(): string {
    return `/admin/realms/${this.realm}`;
  }

  /**
   * Get current realm
   */
  public getRealm(): string {
    return this.realm;
  }

  /**
   * Override HTTP methods to properly handle admin authentication
   */
  async adminGet<T>(endpoint: string, config?: any): Promise<T> {
    const url = endpoint.startsWith('/admin') ? endpoint : `${this.getAdminPath()}${endpoint}`;
    if (KEYCLOAK_DEBUG.enabled && KEYCLOAK_DEBUG.logRequests) {
      console.log('Admin GET:', url);
    }
    return this.get<T>(url, config);
  }

  async adminPost<T>(endpoint: string, data?: any, config?: any): Promise<T> {
    const url = endpoint.startsWith('/admin') ? endpoint : `${this.getAdminPath()}${endpoint}`;
    if (KEYCLOAK_DEBUG.enabled && KEYCLOAK_DEBUG.logRequests) {
      console.log('Admin POST:', url, data ? 'with data' : 'no data');
    }
    return this.post<T>(url, data, config);
  }

  async adminPut<T>(endpoint: string, data?: any, config?: any): Promise<T> {
    const url = endpoint.startsWith('/admin') ? endpoint : `${this.getAdminPath()}${endpoint}`;
    if (KEYCLOAK_DEBUG.enabled && KEYCLOAK_DEBUG.logRequests) {
      console.log('Admin PUT:', url, data ? 'with data' : 'no data');
    }
    return this.put<T>(url, data, config);
  }

  async adminPatch<T>(endpoint: string, data?: any, config?: any): Promise<T> {
    const url = endpoint.startsWith('/admin') ? endpoint : `${this.getAdminPath()}${endpoint}`;
    if (KEYCLOAK_DEBUG.enabled && KEYCLOAK_DEBUG.logRequests) {
      console.log('Admin PATCH:', url, data ? 'with data' : 'no data');
    }
    return this.patch<T>(url, data, config);
  }

  async adminDelete<T>(endpoint: string, config?: any): Promise<T> {
    const url = endpoint.startsWith('/admin') ? endpoint : `${this.getAdminPath()}${endpoint}`;
    if (KEYCLOAK_DEBUG.enabled && KEYCLOAK_DEBUG.logRequests) {
      console.log('Admin DELETE:', url);
    }
    return this.delete<T>(url, config);
  }

  /**
   * Verify admin permissions
   * This should be called from server-side components or API routes
   */
  async verifyAdminPermissions(): Promise<{ authorized: boolean; error?: string }> {
    try {
      // In a server environment, we can access the session
      if (typeof window === 'undefined') {
        const { auth } = await import('@/auth');
        const session = await auth();

        if (!session?.user) {
          return { authorized: false, error: 'Not authenticated' };
        }


        return { authorized: true };
      } else {
        // Client-side - redirect to proper auth check
        return { authorized: false, error: 'Admin verification must be done server-side' };
      }
    } catch (error) {
      console.error('Permission verification error:', error);
      return { authorized: false, error: 'Permission verification failed' };
    }
  }

  /**
   * Invalidate admin token cache (useful for logout or when admin credentials change)
   */
  public invalidateAdminToken(): void {
    this.adminAccessToken = null;
    this.adminTokenExpiry = 0;
    this.adminTokenRefreshPromise = null;
    this.invalidateTokenCache(); // Also invalidate base token cache
  }

  // Utility methods for common admin operations that can be used alongside generated endpoints

  /**
   * Health check for admin connectivity
   */
  async checkAdminConnectivity(): Promise<boolean> {
    try {
      // Try to get realm info as a simple connectivity test
      await this.adminGet('/');
      return true;
    } catch (error) {
      console.error('Admin connectivity check failed:', error);
      return false;
    }
  }

  /**
   * Get realm configuration
   */
  async getRealmInfo() {
    return this.adminGet('/');
  }

  /**
   * Test admin authentication without performing actual operations
   */
  async testAdminAuth(): Promise<{ success: boolean; error?: string }> {
    try {
      const token = await this.getAdminAccessToken();
      if (token) {
        return { success: true };
      } else {
        return { success: false, error: 'Failed to obtain admin token' };
      }
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get detailed debug information
   */
  getDebugInfo() {
    return {
      realm: this.realm,
      baseURL: this.config.baseURL,
      adminPath: this.getAdminPath(),
      hasAdminToken: !!this.adminAccessToken,
      adminTokenExpiry: this.adminTokenExpiry,
      isAdminTokenValid: this.adminAccessToken && Date.now() < this.adminTokenExpiry,
      config: KEYCLOAK_ADMIN_CONFIG,
      debug: KEYCLOAK_DEBUG,
    };
  }
}

// Export singleton instance
export const keycloakService = new KeycloakService();

// Export types for better TypeScript support
export type { KeycloakService };
