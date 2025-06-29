'use client';

import { Session } from 'next-auth';

// Spring APIs
import { createUserProfile } from '@/core/api/generated/spring/endpoints/user-profile-resource/user-profile-resource.gen';

// Types
import type { OrganizationRepresentation } from '@/core/api/generated/keycloak/schemas';
import type { OrganizationDTO, UserProfileDTO } from '@/core/api/generated/spring/schemas';
import { createOrganizationWithSchema } from '@/core/api/generated/spring';

export interface OrganizationSetupRequest {
  organizationName: string;
  domain?: string;
}

export interface OrganizationSetupResult {
  keycloakOrgId: string;
  springOrgId: number;
  userProfileId: number;
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

        // Step 5: Create/update user profile
        console.log('Step 5: Creating user profile...');
        const userProfileId = await this.createUserProfile(session, keycloakUserId);
        console.log('✓ Step 5 completed - User profile ID:', userProfileId);

        // Step 6: Associate user with organization in Spring
        console.log('Step 6: Associating user with organization...');
        await this.associateUserWithOrganization(userProfileId, springOrgId);
        console.log('✓ Step 6 completed - All steps successful');

        return {
          keycloakOrgId,
          springOrgId,
          userProfileId,
        };
      } catch (error: any) {
        if (error.message === 'SETUP_TIMEOUT') {
          console.log('⚠️ Setup timed out on frontend, but backend may still be processing');
          console.log('✓ Returning partial result - progress tracking will handle completion');
          
          // Return partial result, progress tracking will monitor completion
          return {
            keycloakOrgId,
            springOrgId: 0, // Placeholder - actual ID will be retrieved by progress tracking
            userProfileId: 0, // Placeholder - will be created after schema setup completes
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
        console.log('⚠️ Organization creation timed out on frontend, but backend may still be processing...');
        
        // For timeout errors, we'll return a placeholder ID and let the progress tracking handle it
        // The progress component will poll for actual completion
        throw new Error('SETUP_TIMEOUT');
      }
      
      console.error('❌ Organization creation failed:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to create organization');
    }
  }

  /**
   * Create user profile in Spring backend
   */
  private async createUserProfile(session: Session, keycloakUserId: string): Promise<number> {
    console.log('Creating user profile with:', {
      keycloakId: keycloakUserId,
      email: session.user.email,
      firstName: session.user.name?.split(' ')[0],
      lastName: session.user.name?.split(' ').slice(1).join(' '),
    });

    const userProfileDTO: UserProfileDTO = {
      keycloakId: keycloakUserId,
      email: session.user.email!,
      isActive: true,
      ...(session.user.name?.split(' ')[0] && { firstName: session.user.name.split(' ')[0] }),
      ...(session.user.name?.split(' ').slice(1).join(' ') && {
        lastName: session.user.name.split(' ').slice(1).join(' '),
      }),
    };

    console.log('Sending UserProfileDTO to Spring:', userProfileDTO);

    const response = await createUserProfile(userProfileDTO);

    if (!response.id) {
      throw new Error('Failed to create user profile: no ID returned');
    }

    return response.id;
  }

  /**
   * Associate user with organization in Spring
   * Note: This would require an API endpoint to handle the many-to-many relationship
   * For now, we'll assume this is handled automatically based on organization creation
   */
  private async associateUserWithOrganization(
    userProfileId: number,
    organizationId: number
  ): Promise<void> {
    // TODO: Implement organization-user association API
    // This might be handled automatically based on organization membership
    console.log('User-Organization association:', { userProfileId, organizationId });
  }

  /**
   * Check if user has existing organization
   */
  static hasOrganization(session: Session | null): boolean {
    return !!session?.user?.organizations?.length;
  }

  /**
   * Get user's primary organization
   */
  static getPrimaryOrganization(session: Session | null) {
    return session?.user?.organizations?.[0] || null;
  }
}
