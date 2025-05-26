/**
 * Keycloak Admin API Client
 * Server-side client for making authenticated requests to Keycloak Admin API
 */

import { auth } from "@/auth";

interface KeycloakConfig {
  baseUrl: string;
  realm: string;
  adminUsername: string;
  adminPassword: string;
  clientId: string;
  clientSecret: string;
}

class KeycloakAdminClient {
  private config: KeycloakConfig;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor() {
    this.config = {
      baseUrl: process.env.AUTH_KEYCLOAK_ISSUER?.replace('/realms/master', '') || 'http://localhost:9080',
      realm: 'master',
      adminUsername: process.env.KEYCLOAK_ADMIN_USERNAME || 'admin',
      adminPassword: process.env.KEYCLOAK_ADMIN_PASSWORD || 'admin',
      clientId: process.env.AUTH_KEYCLOAK_ID || 'crm-frontend',
      clientSecret: process.env.AUTH_KEYCLOAK_SECRET || '',
    };
  }

  /**
   * Get admin access token
   */
  private async getAccessToken(): Promise<string> {
    // Return cached token if still valid
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      const tokenUrl = `${this.config.baseUrl}/realms/${this.config.realm}/protocol/openid-connect/token`;
      
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'password',
          client_id: this.config.clientId,
          ...(this.config.clientSecret && { client_secret: this.config.clientSecret }),
          username: this.config.adminUsername,
          password: this.config.adminPassword,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Keycloak token response:', errorText);
        throw new Error(`Failed to get admin token: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      this.accessToken = data.access_token;
      this.tokenExpiry = Date.now() + (data.expires_in - 30) * 1000; // Refresh 30s early

      return this.accessToken;
    } catch (error) {
      console.error('Failed to get Keycloak admin token:', error);
      throw error;
    }
  }

  /**
   * Make authenticated request to Keycloak Admin API
   */
  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = await this.getAccessToken();
    
    const url = `${this.config.baseUrl}/admin/realms/${this.config.realm}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Keycloak API error [${response.status}]:`, errorText);
      throw new Error(`Keycloak API error: ${response.status} ${response.statusText}`);
    }

    // Handle empty responses (like DELETE operations)
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return {} as T;
    }

    return response.json();
  }

  /**
   * Get organization members
   */
  async getOrganizationMembers(organizationId: string, params?: Record<string, string>) {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request(`/organizations/${organizationId}/members${queryString}`);
  }

  /**
   * Invite user to organization
   */
  async inviteUserToOrganization(organizationId: string, userData: any) {
    return this.request(`/organizations/${organizationId}/members/invite-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(userData),
    });
  }

  /**
   * Get user details
   */
  async getUser(userId: string) {
    return this.request(`/users/${userId}`);
  }

  /**
   * Get user role mappings
   */
  async getUserRoleMappings(userId: string) {
    return this.request(`/users/${userId}/role-mappings/realm`);
  }

  /**
   * Get user groups
   */
  async getUserGroups(userId: string) {
    return this.request(`/users/${userId}/groups`);
  }

  /**
   * Get available realm roles
   */
  async getRealmRoles() {
    return this.request('/roles');
  }

  /**
   * Get available groups
   */
  async getGroups() {
    return this.request('/groups');
  }

  /**
   * Assign realm roles to user
   */
  async assignRealmRolesToUser(userId: string, roles: any[]) {
    return this.request(`/users/${userId}/role-mappings/realm`, {
      method: 'POST',
      body: JSON.stringify(roles),
    });
  }

  /**
   * Remove realm roles from user
   */
  async removeRealmRolesFromUser(userId: string, roles: any[]) {
    return this.request(`/users/${userId}/role-mappings/realm`, {
      method: 'DELETE',
      body: JSON.stringify(roles),
    });
  }

  /**
   * Add user to group
   */
  async addUserToGroup(userId: string, groupId: string) {
    return this.request(`/users/${userId}/groups/${groupId}`, {
      method: 'PUT',
    });
  }

  /**
   * Remove user from group
   */
  async removeUserFromGroup(userId: string, groupId: string) {
    return this.request(`/users/${userId}/groups/${groupId}`, {
      method: 'DELETE',
    });
  }
}

export const keycloakAdminClient = new KeycloakAdminClient();

/**
 * Verify user has required permissions
 */
export async function verifyAdminPermissions() {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return { authorized: false, error: 'Not authenticated' };
    }

    // Check if user has manage-users role
    const hasPermission = session.user.roles?.includes('manage-users') || false;
    
    if (!hasPermission) {
      return { authorized: false, error: 'Insufficient permissions. Required: manage-users role' };
    }

    return { authorized: true };
  } catch (error) {
    console.error('Permission verification error:', error);
    return { authorized: false, error: 'Permission verification failed' };
  }
}
