import { OrganizationRepresentation } from '@/core/api/generated/keycloak';

export interface UserOrganization {
  id: string;
  name: string;
  alias?: string;
  enabled?: boolean;
  description?: string;
}

export interface UserOrganizationsResponse {
  organizations: UserOrganization[];
  count: number;
  userId: string;
  message: string;
}

export class OrganizationApiService {
  private baseUrl: string;

  constructor(baseUrl: string = '/api/keycloak') {
    this.baseUrl = baseUrl;
  }

  /**
   * Fetch organizations for the current user
   */
  async getUserOrganizations(): Promise<UserOrganization[]> {
    try {
      const response = await fetch(`${this.baseUrl}/me/organizations`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: UserOrganizationsResponse = await response.json();
      return data.organizations || [];
    } catch (error) {
      console.error('Failed to fetch user organizations:', error);
      throw new Error('Failed to fetch organizations');
    }
  }

  /**
   * Fetch details for a specific organization
   */
  async getOrganizationDetails(organizationId: string): Promise<OrganizationRepresentation> {
    try {
      const response = await fetch(`${this.baseUrl}/organizations/${organizationId}/details`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: OrganizationRepresentation = await response.json();
      return data;
    } catch (error) {
      console.error('Failed to fetch organization details:', error);
      throw new Error('Failed to fetch organization details');
    }
  }
}

export const organizationApiService = new OrganizationApiService();
