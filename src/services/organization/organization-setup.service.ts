'use client';

import { Session } from 'next-auth';

// Types
import type { OrganizationRepresentation } from '@/core/api/generated/keycloak/schemas';
import type { OrganizationDTO } from '@/core/api/generated/spring/schemas';
import { createOrganizationWithSchema } from '@/core/api/generated/spring';

export interface OrganizationSetupRequest {
  organizationName: string;
  domain?: string;
}

export interface OrganizationSetupResult {
  keycloakOrgId: string;
  springOrgId: number;
}

/**
 * Service for setting up organization multi-tenancy
 * Coordinates between Keycloak and Spring Backend APIs
 */
export class OrganizationSetupService {
  private realm: string;

  constructor() {
    this.realm = process.env.NEXT_PUBLIC_KEYCLOAK_REALM || 'crm-cup';
  }

  /**
   * Complete organization setup flow
   */
  async setupOrganization(
    request: OrganizationSetupRequest,
    session: Session
  ): Promise<OrganizationSetupResult> {
    if (!session.user?.email) {
      throw new Error('Invalid session: missing user email');
    }

    try {
      // Step 1: Get correct Keycloak user ID
      console.log('Step 1: Getting Keycloak user ID...');
      const keycloakUserId = await this.getKeycloakUserId();
      console.log('✓ Step 1 completed - Keycloak user ID:', keycloakUserId);

      // Step 2: Create Keycloak organization
      console.log('Step 2: Creating Keycloak organization...');
      const keycloakOrgId = await this.createKeycloakOrganization(request);
      console.log('✓ Step 2 completed - Keycloak org ID:', keycloakOrgId);

      // Step 3: Add user as organization member
      console.log('Step 3: Adding user to organization...');
      await this.addUserToOrganization(keycloakOrgId, keycloakUserId);
      console.log('✓ Step 3 completed - User added to organization');

      // Step 4: Create Spring organization record and setup tenant schema
      console.log('Step 4: Creating Spring organization with schema setup...');
      try {
        const springOrgId = await this.createSpringOrganization(request, keycloakOrgId);
        console.log('✓ Step 4 completed - Spring org ID:', springOrgId);
        console.log('✓ All steps completed successfully');

        return {
          keycloakOrgId,
          springOrgId,
        };
      } catch (error: any) {
        if (error.message === 'SETUP_TIMEOUT') {
          console.log('⚠️ Setup timed out on frontend, but backend may still be processing');
          console.log('✓ Returning partial result - progress tracking will handle completion');

          // Return partial result, progress tracking will monitor completion
          return {
            keycloakOrgId,
            springOrgId: 0, // Placeholder - actual ID will be retrieved by progress tracking
          };
        }
        throw error;
      }
    } catch (error) {
      console.error('❌ Organization setup failed at step:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to setup organization');
    }
  }

  /**
   * Get correct Keycloak user ID for current session
   */
  private async getKeycloakUserId(): Promise<string> {
    const response = await fetch('/api/keycloak/user/current');

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get Keycloak user ID');
    }

    const userData = await response.json();

    if (!userData.keycloakUserId) {
      throw new Error('No Keycloak user ID found');
    }

    return userData.keycloakUserId;
  }

  /**
   * Create organization in Keycloak
   */
  private async createKeycloakOrganization(request: OrganizationSetupRequest): Promise<string> {
    const organizationData = {
      organizationName: request.organizationName,
      displayName: request.organizationName, // Use organization name as display name
      description: `CRM organization for ${request.organizationName}`,
      domain: request.domain,
    };

    // Create the organization via API route
    const createResponse = await fetch('/api/keycloak/organizations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(organizationData),
    });

    if (!createResponse.ok) {
      const error = await createResponse.json();

      // Handle 409 conflict error specifically
      if (createResponse.status === 409) {
        throw new Error('ORGANIZATION_EXISTS');
      }

      throw new Error(error.error || 'Failed to create organization');
    }

    // Fetch organizations to get the created one's ID
    const listResponse = await fetch(
      `/api/keycloak/organizations?search=${encodeURIComponent(request.organizationName)}`
    );

    if (!listResponse.ok) {
      throw new Error('Failed to retrieve created organization');
    }

    const { organizations } = await listResponse.json();
    const createdOrg = organizations.find((org: any) => org.name === request.organizationName);

    if (!createdOrg?.id) {
      throw new Error('Failed to retrieve created organization ID');
    }

    return createdOrg.id;
  }

  /**
   * Add user as member of Keycloak organization
   */
  private async addUserToOrganization(orgId: string, userId: string): Promise<void> {
    const response = await fetch(`/api/keycloak/organizations/${orgId}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to add user to organization');
    }
  }

  /**
   * Create organization record in Spring backend with tenant schema setup
   */
  private async createSpringOrganization(
    request: OrganizationSetupRequest,
    keycloakOrgId: string
  ): Promise<number> {
    console.log('Creating Spring organization with schema setup:', {
      keycloakOrgId,
      name: request.organizationName,
      domain: request.domain,
    });

    const organizationDTO: OrganizationDTO = {
      keycloakOrgId,
      name: request.organizationName,
      isActive: true,
      ...(request.domain && { domain: request.domain }),
    };

    console.log('Sending OrganizationDTO to Spring:', organizationDTO);

    try {
      // Use the correct endpoint that creates organization AND sets up schema
      // This is a long-running operation, so we handle timeouts gracefully
      const response = await createOrganizationWithSchema(organizationDTO);

      if (!response.id) {
        throw new Error('Failed to create organization: no ID returned');
      }

      return response.id;
    } catch (error: any) {
      // If it's a timeout error, the backend might still be processing
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        console.log(
          '⚠️ Organization creation timed out on frontend, but backend may still be processing...'
        );

        // For timeout errors, we'll return a placeholder ID and let the progress tracking handle it
        // The progress component will poll for actual completion
        throw new Error('SETUP_TIMEOUT');
      }

      console.error('❌ Organization creation failed:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to create organization');
    }
  }

  /**
   * Check if user has existing organization
   * TODO: Implement proper organization checking logic
   */
  static hasOrganization(session: Session | null): boolean {
    // TODO: Implement organization checking logic
    return false;
  }

  /**
   * Get user's primary organization
   * TODO: Implement proper organization retrieval logic
   */
  static getPrimaryOrganization(session: Session | null) {
    // TODO: Implement organization retrieval logic
    return null;
  }
}
