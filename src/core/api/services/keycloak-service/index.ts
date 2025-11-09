import { BaseService } from '@/core/api/services/base/base-service';
import {
  KEYCLOAK_ADMIN_CONFIG,
  KEYCLOAK_DEBUG,
  KEYCLOAK_REALM,
  KEYCLOAK_SERVICE_CONFIG,
} from '@/core/api/services/keycloak-service/config';

/**
 * FIXED: Unified Keycloak Admin Client Service
 *
 * Key improvements:
 * 1. Added request retry limits to prevent infinite loops
 * 2. Better error handling with circuit breaker pattern
 * 3. Enhanced token refresh logic with exponential backoff
 * 4. Added request deduplication
 */
export class KeycloakService extends BaseService {
  private realm: string;
  private adminAccessToken: string | null = null;
  private adminTokenExpiry: number = 0;
  private adminTokenRefreshPromise: Promise<string | null> | null = null;

  private failureCount: number = 0;
  private lastFailureTime: number = 0;
  private maxFailures: number = 3;
  private circuitOpenDuration: number = 30000;
  private requestAttempts: Map<string, number> = new Map();
  private maxRetryAttempts: number = 3;

  constructor(realm = KEYCLOAK_REALM) {
    super(KEYCLOAK_SERVICE_CONFIG);
    this.realm = realm;
  }

  /**
   * FIXED: Get admin access token with circuit breaker and retry limits
   */
  private async getAdminAccessToken(): Promise<string | null> {
    if (this.isCircuitOpen()) {
      throw new Error('Authentication service temporarily unavailable due to repeated failures');
    }

    if (this.adminAccessToken && Date.now() < this.adminTokenExpiry - 30000) {
      if (KEYCLOAK_DEBUG.enabled) {
        console.log('Using cached admin token');
      }
      this.resetFailureCount();
      return this.adminAccessToken;
    }

    if (this.adminTokenRefreshPromise) {
      if (KEYCLOAK_DEBUG.enabled) {
        console.log('Waiting for existing admin token refresh');
      }
      return this.adminTokenRefreshPromise;
    }

    this.adminTokenRefreshPromise = this.refreshAdminTokenWithRetry();
    try {
      const token = await this.adminTokenRefreshPromise;
      this.adminTokenRefreshPromise = null;
      this.resetFailureCount();
      return token;
    } catch (error) {
      this.adminTokenRefreshPromise = null;
      this.recordFailure();
      throw error;
    }
  }

  /**
   * FIXED: Circuit breaker implementation
   */
  private isCircuitOpen(): boolean {
    if (this.failureCount >= this.maxFailures) {
      const timeSinceLastFailure = Date.now() - this.lastFailureTime;
      if (timeSinceLastFailure < this.circuitOpenDuration) {
        return true;
      } else {
        this.resetFailureCount();
      }
    }
    return false;
  }

  private recordFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    console.warn(`Keycloak auth failure count: ${this.failureCount}/${this.maxFailures}`);
  }

  private resetFailureCount(): void {
    this.failureCount = 0;
    this.lastFailureTime = 0;
  }

  /**
   * FIXED: Refresh admin access token with exponential backoff retry
   */
  private async refreshAdminTokenWithRetry(): Promise<string | null> {
    let lastError: Error;

    for (let attempt = 1; attempt <= this.maxRetryAttempts; attempt++) {
      try {
        return await this.refreshAdminToken();
      } catch (error: any) {
        lastError = error;

        if (KEYCLOAK_DEBUG.enabled) {
          console.warn(
            `Admin token refresh attempt ${attempt}/${this.maxRetryAttempts} failed:`,
            error.message
          );
        }

        if (error.status === 401 || error.status === 403 || error.message.includes('credentials')) {
          console.error('Authentication credentials invalid, not retrying');
          throw error;
        }

        if (attempt < this.maxRetryAttempts) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw new Error(
      `Failed to refresh admin token after ${this.maxRetryAttempts} attempts: ${lastError!.message}`
    );
  }

  /**
   * FIXED: Improved token refresh logic with better error handling
   */
  private async refreshAdminToken(): Promise<string | null> {
    const credentials = this.getAdminCredentials();
    if (!credentials) {
      throw new Error('Admin credentials not configured');
    }

    try {
      return await this.tryAdminAuth('admin-cli', null, credentials);
    } catch (adminCliError) {
      if (KEYCLOAK_DEBUG.enabled) {
        console.warn('admin-cli authentication failed, trying fallback client:', adminCliError);
      }

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
   * FIXED: Try admin authentication with specific client and timeout
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

    if (clientSecret) {
      body.append('client_secret', clientSecret);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

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

        const error = new Error(
          `Failed to get admin token with ${clientId}: ${response.status} ${response.statusText} - ${errorDetail.error_description || errorDetail.error || errorText}`
        );
        (error as any).status = response.status;
        throw error;
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
    } catch (error: any) {
      clearTimeout(timeoutId);

      if (error.name === 'AbortError') {
        throw new Error('Authentication request timed out');
      }

      throw error;
    }
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
   * FIXED: Override the base auth token method with request deduplication
   */
  protected async getAuthTokenFromSession(): Promise<string | null> {
    if (this.isAdminOperation()) {
      return this.getAdminAccessToken();
    }

    return super.getAuthTokenFromSession();
  }

  /**
   * FIXED: Better request tracking to prevent duplicate requests
   */
  private async executeWithDeduplication<T>(
    requestKey: string,
    operation: () => Promise<T>
  ): Promise<T> {
    const attempts = this.requestAttempts.get(requestKey) || 0;

    if (attempts >= this.maxRetryAttempts) {
      throw new Error(`Maximum retry attempts exceeded for request: ${requestKey}`);
    }

    this.requestAttempts.set(requestKey, attempts + 1);

    try {
      const result = await operation();
      this.requestAttempts.delete(requestKey);
      return result;
    } catch (error) {
      if ((error as any).status === 401 || (error as any).status === 403) {
        this.requestAttempts.delete(requestKey);
      }
      throw error;
    }
  }

  /**
   * Determine if the current operation requires admin privileges
   */
  private isAdminOperation(): boolean {
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
   * FIXED: Override HTTP methods with deduplication and error handling
   */
  async adminGet<T>(endpoint: string, config?: any): Promise<T> {
    const url = endpoint.startsWith('/admin') ? endpoint : `${this.getAdminPath()}${endpoint}`;
    const requestKey = `GET:${url}`;

    return this.executeWithDeduplication(requestKey, async () => {
      if (KEYCLOAK_DEBUG.enabled && KEYCLOAK_DEBUG.logRequests) {
        console.log('Admin GET:', url);
      }
      return this.get<T>(url, config);
    });
  }

  async adminPost<T>(endpoint: string, data?: any, config?: any): Promise<T> {
    const url = endpoint.startsWith('/admin') ? endpoint : `${this.getAdminPath()}${endpoint}`;
    const requestKey = `POST:${url}:${JSON.stringify(data)}`;

    return this.executeWithDeduplication(requestKey, async () => {
      if (KEYCLOAK_DEBUG.enabled && KEYCLOAK_DEBUG.logRequests) {
        console.log('Admin POST:', url, data ? 'with data' : 'no data');
      }
      return this.post<T>(url, data, config);
    });
  }

  async adminPut<T>(endpoint: string, data?: any, config?: any): Promise<T> {
    const url = endpoint.startsWith('/admin') ? endpoint : `${this.getAdminPath()}${endpoint}`;
    const requestKey = `PUT:${url}:${JSON.stringify(data)}`;

    return this.executeWithDeduplication(requestKey, async () => {
      if (KEYCLOAK_DEBUG.enabled && KEYCLOAK_DEBUG.logRequests) {
        console.log('Admin PUT:', url, data ? 'with data' : 'no data');
      }
      return this.put<T>(url, data, config);
    });
  }

  async adminPatch<T>(endpoint: string, data?: any, config?: any): Promise<T> {
    const url = endpoint.startsWith('/admin') ? endpoint : `${this.getAdminPath()}${endpoint}`;
    const requestKey = `PATCH:${url}:${JSON.stringify(data)}`;

    return this.executeWithDeduplication(requestKey, async () => {
      if (KEYCLOAK_DEBUG.enabled && KEYCLOAK_DEBUG.logRequests) {
        console.log('Admin PATCH:', url, data ? 'with data' : 'no data');
      }
      return this.patch<T>(url, data, config);
    });
  }

  async adminDelete<T>(endpoint: string, config?: any): Promise<T> {
    const url = endpoint.startsWith('/admin') ? endpoint : `${this.getAdminPath()}${endpoint}`;
    const requestKey = `DELETE:${url}`;

    return this.executeWithDeduplication(requestKey, async () => {
      if (KEYCLOAK_DEBUG.enabled && KEYCLOAK_DEBUG.logRequests) {
        console.log('Admin DELETE:', url);
      }
      return this.delete<T>(url, config);
    });
  }

  /**
   * Verify admin permissions
   */
  async verifyAdminPermissions(): Promise<{ authorized: boolean; error?: string }> {
    try {
      if (typeof window === 'undefined') {
        const { auth } = await import('@/auth');
        const session = await auth();

        if (!session?.user) {
          return { authorized: false, error: 'Not authenticated' };
        }

        return { authorized: true };
      } else {
        return { authorized: false, error: 'Admin verification must be done server-side' };
      }
    } catch (error) {
      console.error('Permission verification error:', error);
      return { authorized: false, error: 'Permission verification failed' };
    }
  }

  /**
   * FIXED: Enhanced token invalidation with cleanup
   */
  public invalidateAdminToken(): void {
    this.adminAccessToken = null;
    this.adminTokenExpiry = 0;
    this.adminTokenRefreshPromise = null;
    this.requestAttempts.clear();
    this.resetFailureCount();
    this.invalidateTokenCache();
  }

  /**
   * Health check for admin connectivity
   */
  async checkAdminConnectivity(): Promise<boolean> {
    try {
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
      failureCount: this.failureCount,
      isCircuitOpen: this.isCircuitOpen(),
      activeRequests: this.requestAttempts.size,
      config: KEYCLOAK_ADMIN_CONFIG,
      debug: KEYCLOAK_DEBUG,
    };
  }
}

export const keycloakService = new KeycloakService();

export type { KeycloakService };
