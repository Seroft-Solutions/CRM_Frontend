import { Session } from 'next-auth';
import {
  createOrganization,
  getOrganizations,
  addOrganizationMember,
} from '@/core/api/generated/keycloak';
import { keycloakService } from '@/core/api/services/keycloak-service';
import { createOrganizationWithSchema } from '@/core/api/generated/spring';
import type { OrganizationRepresentation } from '@/core/api/generated/keycloak/schemas';
import type { OrganizationDTO } from '@/core/api/generated/spring/schemas';
import { AdminGroupAssignmentResult } from './admin-group.service';
import { AdminGroupService } from './admin-group.service';

export interface OrganizationSetupRequest {
  organizationName: string;
  domain?: string;
}

export interface OrganizationSetupResult {
  keycloakOrgId: string;
  springOrgId: number;
  adminGroupAssignment?: AdminGroupAssignmentResult;
}

/**
 * Service for setting up organization multi-tenancy
 * Coordinates between Keycloak and Spring Backend APIs
 */
export class OrganizationSetupService {
  private realm: string;
  private adminGroupService: AdminGroupService;

  constructor() {
    this.realm = keycloakService.getRealm();
    this.adminGroupService = new AdminGroupService();
  }

  /**
   * Complete organization setup flow
   */
  async setupOrganization(
    request: OrganizationSetupRequest,
    session: Session
  ): Promise<OrganizationSetupResult> {
    if (!session.user?.id) {
      throw new Error('Invalid session: missing user ID');
    }
    const keycloakUserId = session.user.id;

    try {
      // Step 1: Create Keycloak organization
      console.log('Step 1: Creating Keycloak organization...');
      const keycloakOrgId = await this.createKeycloakOrganization(request);
      console.log('✓ Step 1 completed - Keycloak org ID:', keycloakOrgId);

      // Step 2: Add user as organization member
      console.log('Step 2: Adding user to organization...');
      await this.addUserToOrganization(keycloakOrgId, keycloakUserId);
      console.log('✓ Step 2 completed - User added to organization');

      // Step 3: Assign user to Admin group
      console.log('Step 3: Assigning user to Admin group...');
      const adminGroupAssignment = await this.adminGroupService.assignUserToAdminGroup(
        keycloakOrgId,
        keycloakUserId
      );
      if (adminGroupAssignment.success) {
        console.log('✓ Step 3 completed - User assigned to Admin group');
      } else {
        console.warn('⚠️ Step 3 failed - Could not assign user to Admin group:', adminGroupAssignment.error);
      }

      // Step 4: Create Spring organization record and setup tenant schema
      console.log('Step 4: Creating Spring organization with schema setup...');
      try {
        const springOrgId = await this.createSpringOrganization(request, keycloakOrgId);
        console.log('✓ Step 4 completed - Spring org ID:', springOrgId);
        console.log('✓ All steps completed successfully');

        return {
          keycloakOrgId,
          springOrgId,
          adminGroupAssignment,
        };
      } catch (error: any) {
        if (error.message === 'SETUP_TIMEOUT') {
          console.log('⚠️ Setup timed out on frontend, but backend may still be processing');
          console.log('✓ Returning partial result - progress tracking will handle completion');

          // Return partial result, progress tracking will monitor completion
          return {
            keycloakOrgId,
            springOrgId: 0, // Placeholder - actual ID will be retrieved by progress tracking
            adminGroupAssignment,
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
   * Create organization in Keycloak
   */
  private async createKeycloakOrganization(request: OrganizationSetupRequest): Promise<string> {
    const organizationData: OrganizationRepresentation = {
      name: request.organizationName,
      attributes: {
        displayName: [request.organizationName],
        description: [`CRM organization for ${request.organizationName}`],
        domain: request.domain ? [request.domain] : [],
      },
    };

    try {
      await createOrganization(this.realm, organizationData);
    } catch (error: any) {
      if (error.status === 409) {
        throw new Error('ORGANIZATION_EXISTS');
      }
      throw error;
    }

    const organizations = await getOrganizations(this.realm, {
      search: request.organizationName,
    });
    const createdOrg = organizations.find((org) => org.name === request.organizationName);

    if (!createdOrg?.id) {
      throw new Error('Failed to retrieve created organization ID');
    }

    return createdOrg.id;
  }

  /**
   * Add user as member of Keycloak organization
   */
  private async addUserToOrganization(orgId: string, userId: string): Promise<void> {
    await addOrganizationMember(this.realm, orgId, userId);
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
