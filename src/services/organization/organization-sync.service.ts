'use client';

import { Session } from 'next-auth';

// Keycloak APIs
import { getAdminRealmsRealmOrganizations } from '@/core/api/generated/keycloak/endpoints/organizations/organizations.gen';

// Spring APIs
import { 
  getAllOrganizations, 
  createOrganization 
} from '@/core/api/generated/spring/endpoints/organization-resource/organization-resource.gen';
import { 
  getAllUserProfiles, 
  createUserProfile,
  searchUserProfiles 
} from '@/core/api/generated/spring/endpoints/user-profile-resource/user-profile-resource.gen';

// Types
import type { OrganizationDTO, UserProfileDTO } from '@/core/api/generated/spring/schemas';
import type { OrganizationRepresentation } from '@/core/api/generated/keycloak/schemas';

export interface SyncResult {
  organizationSynced: boolean;
  userProfileSynced: boolean;
  organizationId?: number;
  userProfileId?: number;
  errors: string[];
}

/**
 * Service to sync Keycloak data with Spring backend
 * Handles cases where data exists in Keycloak but missing in Spring
 */
export class OrganizationSyncService {
  private realm: string;

  constructor() {
    this.realm = process.env.NEXT_PUBLIC_KEYCLOAK_REALM || 'crm-cup';
  }

  /**
   * Sync user's organization and profile data from Keycloak to Spring
   * Note: This service will be deprecated as organizations are now fetched via API
   */
  async syncUserData(session: Session): Promise<SyncResult> {
    const result: SyncResult = {
      organizationSynced: false,
      userProfileSynced: false,
      errors: []
    };

    // This service needs to be refactored to work with API-based organization data
    // For now, we'll attempt to get organizations from Keycloak directly
    try {
      const keycloakOrgs = await getAdminRealmsRealmOrganizations(this.realm);
      if (!keycloakOrgs?.length) {
        result.errors.push('No organizations found for user');
        return result;
      }

      // Use first organization found
      const sessionOrg = { id: keycloakOrgs[0].id!, name: keycloakOrgs[0].name! };
      
      // Sync organization
      const orgResult = await this.syncOrganization(sessionOrg);
      result.organizationSynced = orgResult.synced;
      result.organizationId = orgResult.id;
      if (orgResult.error) result.errors.push(orgResult.error);

      // Sync user profile
      const userResult = await this.syncUserProfile(session, result.organizationId);
      result.userProfileSynced = userResult.synced;
      result.userProfileId = userResult.id;
      if (userResult.error) result.errors.push(userResult.error);

    } catch (error) {
      result.errors.push(error instanceof Error ? error.message : 'Sync failed');
    }

    return result;
  }

  /**
   * Sync organization from Keycloak to Spring
   */
  private async syncOrganization(sessionOrg: { id: string; name: string }): Promise<{ synced: boolean; id?: number; error?: string }> {
    try {
      // Check if organization exists in Spring by keycloakOrgId
      const existingOrgs = await getAllOrganizations({
        'keycloakOrgId.equals': sessionOrg.id
      });

      if (existingOrgs?.length > 0) {
        return { synced: true, id: existingOrgs[0].id };
      }

      // Get full organization data from Keycloak
      const keycloakOrgs = await getAdminRealmsRealmOrganizations(this.realm, {
        search: sessionOrg.name
      });

      const keycloakOrg = keycloakOrgs.find(org => org.id === sessionOrg.id);
      if (!keycloakOrg) {
        return { synced: false, error: 'Organization not found in Keycloak' };
      }

      // Create organization in Spring
      const organizationDTO: OrganizationDTO = {
        keycloakOrgId: sessionOrg.id,
        name: keycloakOrg.name || sessionOrg.name,
        displayName: keycloakOrg.displayName || sessionOrg.name,
        domain: keycloakOrg.domains?.[0]?.name,
        isActive: true,
        createdDate: new Date().toISOString(),
      };

      const response = await createOrganization({ data: organizationDTO });
      
      return { 
        synced: true, 
        id: response.id,
      };

    } catch (error) {
      return { 
        synced: false, 
        error: `Failed to sync organization: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  /**
   * Sync user profile from session to Spring
   */
  private async syncUserProfile(session: Session, organizationId?: number): Promise<{ synced: boolean; id?: number; error?: string }> {
    try {
      if (!session.user?.id || !session.user?.email) {
        return { synced: false, error: 'Invalid session data' };
      }

      // Check if user profile exists in Spring by keycloakId
      const existingUsers = await searchUserProfiles({
        query: `keycloakId:${session.user.id}`
      });

      if (existingUsers?.length > 0) {
        const existingUser = existingUsers[0];
        
        // Check if user needs organization association
        if (organizationId && existingUser.organization?.every(org => org.id !== organizationId)) {
          // TODO: Add API to associate user with organization
          console.log('User profile exists but needs organization association', {
            userId: existingUser.id,
            organizationId
          });
        }
        
        return { synced: true, id: existingUser.id };
      }

      // Create user profile in Spring
      const userProfileDTO: UserProfileDTO = {
        keycloakId: session.user.id,
        email: session.user.email,
        firstName: session.user.name?.split(' ')[0] || '',
        lastName: session.user.name?.split(' ').slice(1).join(' ') || '',
        isActive: true,
        createdDate: new Date().toISOString(),
        organization: organizationId ? [{ id: organizationId }] : undefined,
      };

      const response = await createUserProfile({ data: userProfileDTO });
      
      return { 
        synced: true, 
        id: response.id,
      };

    } catch (error) {
      return { 
        synced: false, 
        error: `Failed to sync user profile: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  /**
   * Check if sync is needed for a user session
   * Note: This method is deprecated as organizations are now fetched via API
   */
  static async checkSyncNeeded(session: Session): Promise<boolean> {
    // This method needs to be refactored to work with API-based organization data
    // For now, return false as sync logic should be handled elsewhere
    console.warn('OrganizationSyncService.checkSyncNeeded is deprecated - use API-based organization checking');
    return false;
  }
}
