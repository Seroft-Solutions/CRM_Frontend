'use client';

import { Session } from 'next-auth';
import type { OrganizationDTO } from '@/core/api/generated/spring/schemas';
import { createOrganizationWithSchema } from '@/core/api/generated/spring';

export interface OrganizationSetupRequest {
  organizationName: string;
  domain?: string;
  organizationCode?: string;
  organizationEmail?: string;
}

export interface OrganizationSetupResult {
  keycloakOrgId: string;
  springOrgId: number;
}

interface GroupOption {
  id?: string;
  name?: string;
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
   * Check if user has existing organization
   * TODO: Implement proper organization checking logic
   */
  static hasOrganization(session: Session | null): boolean {
    return false;
  }

  /**
   * Get user's primary organization
   * TODO: Implement proper organization retrieval logic
   */
  static getPrimaryOrganization(session: Session | null) {
    return null;
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
      console.log('Step 1: Getting Keycloak user ID...');
      const keycloakUserId = await this.getKeycloakUserId();
      console.log('✓ Step 1 completed - Keycloak user ID:', keycloakUserId);

      console.log('Step 2: Creating Keycloak organization...');
      const keycloakOrgId = await this.createKeycloakOrganization(request);
      console.log('✓ Step 2 completed - Keycloak org ID:', keycloakOrgId);

      console.log('Step 3: Adding user to organization...');
      await this.addUserToOrganization(keycloakOrgId, keycloakUserId);
      console.log('✓ Step 3 completed - User added to organization');

      console.log('Step 3b: Seeding Super Admin user...');
      await this.seedSuperAdminUser(keycloakOrgId);
      console.log('✓ Step 3b completed - Super Admin user handled');

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

          return {
            keycloakOrgId,
            springOrgId: 0,
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
   * Create a default Super Admin user in the organization (best-effort, non-blocking).
   */
  private async seedSuperAdminUser(orgId: string): Promise<void> {
    try {
      const superAdminGroup = await this.findGroupByName('super admin');
      const selectedGroups = superAdminGroup?.id ? [{ id: superAdminGroup.id }] : [];

      const response = await fetch(`/api/keycloak/organizations/${orgId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@gmail.com',
          firstName: 'super',
          lastName: 'admin',
          selectedGroups,
          sendWelcomeEmail: false,
          sendPasswordReset: false,
          password: 'admin',
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        console.warn('Super Admin seed: failed to create/invite user', {
          status: response.status,
          error,
        });
      }
    } catch (error) {
      console.warn('Super Admin seed: unexpected error (non-blocking)', error);
    }
  }

  private async findGroupByName(name: string): Promise<GroupOption | null> {
    try {
      const response = await fetch(`/api/keycloak/groups?search=${encodeURIComponent(name)}`);
      if (!response.ok) {
        return null;
      }
      const groups: GroupOption[] = await response.json();
      const lower = name.trim().toLowerCase();

      return (
        groups.find((g) => (g.name || '').toLowerCase() === lower) ||
        groups.find((g) => (g.name || '').toLowerCase().includes(lower)) ||
        null
      );
    } catch {
      return null;
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
      displayName: request.organizationName,
      description: `CRM organization for ${request.organizationName}`,
      organizationCode: request.organizationCode,
      organizationEmail: request.organizationEmail,
      domain: request.domain,
    };

    const createResponse = await fetch('/api/keycloak/organizations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(organizationData),
    });

    if (!createResponse.ok) {
      const error = await createResponse.json();

      if (createResponse.status === 409) {
        throw new Error('ORGANIZATION_EXISTS');
      }

      throw new Error(error.error || 'Failed to create organization');
    }

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
      body: JSON.stringify({
        userId,
        isOrganizationOwner: true,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to add user to organization');
    }

    console.log('✓ Organization owner added with admin privileges');
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
      displayName: request.organizationName,
      status: 'ACTIVE',
      ...(request.domain && { domain: request.domain }),
    };

    console.log('Sending OrganizationDTO to Spring:', organizationDTO);

    try {
      const response = await createOrganizationWithSchema(organizationDTO);

      if (!response.id) {
        throw new Error('Failed to create organization: no ID returned');
      }

      return response.id;
    } catch (error: any) {
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        console.log(
          '⚠️ Organization creation timed out on frontend, but backend may still be processing...'
        );

        throw new Error('SETUP_TIMEOUT');
      }

      console.error('❌ Organization creation failed:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to create organization');
    }
  }
}
