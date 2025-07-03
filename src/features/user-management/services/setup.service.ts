/**
 * Setup Service for Initial Data Population
 * Fetches existing data from Keycloak and populates Spring Database
 * Run this during organization setup or system initialization
 */

import { dualStorageService } from './dual-storage.service';
import { keycloakService } from '@/core/api/services/keycloak-service';
import {
  getAdminRealmsRealmUsers,
  getAdminRealmsRealmGroups,
  getAdminRealmsRealmRoles,
  getAdminRealmsRealmUsersUserIdGroups,
  getAdminRealmsRealmUsersUserIdRoleMappingsRealm,
} from '@/core/api/generated/keycloak';
import {
  createUserProfile,
  createGroup,
  createRole,
  getAllUserProfiles,
  getAllGroups,
  getAllRoles,
} from '@/core/api/generated/spring';
import type {
  UserRepresentation,
  GroupRepresentation,
  RoleRepresentation,
} from '@/core/api/generated/keycloak';
import type {
  UserProfileDTO,
  GroupDTO,
  RoleDTO,
} from '@/core/api/generated/spring';

export interface SetupProgress {
  phase: 'roles' | 'groups' | 'users' | 'completed' | 'error';
  message: string;
  progress: number; // 0-100
  details?: {
    processed: number;
    total: number;
    currentItem?: string;
  };
}

export interface SetupResult {
  success: boolean;
  summary: {
    rolesCreated: number;
    groupsCreated: number;
    usersCreated: number;
    errors: string[];
  };
  details: {
    existingRoles: number;
    existingGroups: number;
    existingUsers: number;
    skippedRoles: number;
    skippedGroups: number;
    skippedUsers: number;
  };
}

export type SetupProgressCallback = (progress: SetupProgress) => void;

/**
 * Setup Service Class
 * Handles initial synchronization of Keycloak data to Spring Database
 */
export class SetupService {
  private realm: string;

  constructor() {
    this.realm = keycloakService.getRealm();
  }

  /**
   * Complete setup process - populate all data from Keycloak to Spring
   */
  async populateSpringFromKeycloak(
    organizationId: string,
    onProgress?: SetupProgressCallback
  ): Promise<SetupResult> {
    const result: SetupResult = {
      success: false,
      summary: {
        rolesCreated: 0,
        groupsCreated: 0,
        usersCreated: 0,
        errors: [],
      },
      details: {
        existingRoles: 0,
        existingGroups: 0,
        existingUsers: 0,
        skippedRoles: 0,
        skippedGroups: 0,
        skippedUsers: 0,
      },
    };

    try {
      // Step 1: Setup Roles
      onProgress?.({
        phase: 'roles',
        message: 'Setting up roles...',
        progress: 10,
      });

      const rolesResult = await this.setupRoles(organizationId, onProgress);
      result.summary.rolesCreated = rolesResult.created;
      result.details.existingRoles = rolesResult.existing;
      result.details.skippedRoles = rolesResult.skipped;
      result.summary.errors.push(...rolesResult.errors);

      // Step 2: Setup Groups
      onProgress?.({
        phase: 'groups',
        message: 'Setting up groups...',
        progress: 40,
      });

      const groupsResult = await this.setupGroups(organizationId, onProgress);
      result.summary.groupsCreated = groupsResult.created;
      result.details.existingGroups = groupsResult.existing;
      result.details.skippedGroups = groupsResult.skipped;
      result.summary.errors.push(...groupsResult.errors);

      // Step 3: Setup Users
      onProgress?.({
        phase: 'users',
        message: 'Setting up users...',
        progress: 70,
      });

      const usersResult = await this.setupUsers(organizationId, onProgress);
      result.summary.usersCreated = usersResult.created;
      result.details.existingUsers = usersResult.existing;
      result.details.skippedUsers = usersResult.skipped;
      result.summary.errors.push(...usersResult.errors);

      // Complete
      onProgress?.({
        phase: 'completed',
        message: 'Setup completed successfully!',
        progress: 100,
      });

      result.success = result.summary.errors.length === 0;

      console.log('🎉 Setup completed:', result);
      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown setup error';
      result.summary.errors.push(errorMessage);

      onProgress?.({
        phase: 'error',
        message: `Setup failed: ${errorMessage}`,
        progress: 0,
      });

      console.error('❌ Setup failed:', error);
      return result;
    }
  }

  /**
   * Setup roles from Keycloak to Spring
   */
  private async setupRoles(
    organizationId: string,
    onProgress?: SetupProgressCallback
  ): Promise<{ created: number; existing: number; skipped: number; errors: string[] }> {
    const result = { created: 0, existing: 0, skipped: 0, errors: [] as string[] };

    try {
      // Get existing roles from both systems
      const [keycloakRoles, springRoles] = await Promise.all([
        getAdminRealmsRealmRoles(this.realm),
        getAllRoles(),
      ]);

      result.existing = springRoles.length;

      for (let i = 0; i < keycloakRoles.length; i++) {
        const keycloakRole = keycloakRoles[i];
        
        onProgress?.({
          phase: 'roles',
          message: `Processing role: ${keycloakRole.name}`,
          progress: 10 + (i / keycloakRoles.length) * 20,
          details: {
            processed: i,
            total: keycloakRoles.length,
            currentItem: keycloakRole.name,
          },
        });

        // Skip if role already exists in Spring
        const existingSpringRole = springRoles.find(
          sr => sr.keycloakRoleId === keycloakRole.id
        );

        if (existingSpringRole) {
          result.skipped++;
          continue;
        }

        // Create role in Spring
        try {
          const springRole: RoleDTO = {
            keycloakRoleId: keycloakRole.id!,
            name: keycloakRole.name!,
            description: keycloakRole.description || '',
            isActive: true,
          };

          await createRole({ data: springRole });
          result.created++;
          console.log(`✅ Created role in Spring: ${keycloakRole.name}`);

        } catch (error) {
          const errorMsg = `Failed to create role ${keycloakRole.name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          result.errors.push(errorMsg);
          console.error(`❌ ${errorMsg}`);
        }
      }

      return result;

    } catch (error) {
      const errorMsg = `Failed to setup roles: ${error instanceof Error ? error.message : 'Unknown error'}`;
      result.errors.push(errorMsg);
      return result;
    }
  }

  /**
   * Setup groups from Keycloak to Spring
   */
  private async setupGroups(
    organizationId: string,
    onProgress?: SetupProgressCallback
  ): Promise<{ created: number; existing: number; skipped: number; errors: string[] }> {
    const result = { created: 0, existing: 0, skipped: 0, errors: [] as string[] };

    try {
      // Get existing groups from both systems
      const [keycloakGroups, springGroups] = await Promise.all([
        getAdminRealmsRealmGroups(this.realm),
        getAllGroups(),
      ]);

      result.existing = springGroups.length;

      for (let i = 0; i < keycloakGroups.length; i++) {
        const keycloakGroup = keycloakGroups[i];
        
        onProgress?.({
          phase: 'groups',
          message: `Processing group: ${keycloakGroup.name}`,
          progress: 40 + (i / keycloakGroups.length) * 20,
          details: {
            processed: i,
            total: keycloakGroups.length,
            currentItem: keycloakGroup.name,
          },
        });

        // Skip if group already exists in Spring
        const existingSpringGroup = springGroups.find(
          sg => sg.keycloakGroupId === keycloakGroup.id
        );

        if (existingSpringGroup) {
          result.skipped++;
          continue;
        }

        // Create group in Spring
        try {
          const springGroup: GroupDTO = {
            keycloakGroupId: keycloakGroup.id!,
            name: keycloakGroup.name!,
            path: keycloakGroup.path || `/${keycloakGroup.name}`,
            description: this.extractDescription(keycloakGroup),
            isActive: true,
          };

          await createGroup({ data: springGroup });
          result.created++;
          console.log(`✅ Created group in Spring: ${keycloakGroup.name}`);

        } catch (error) {
          const errorMsg = `Failed to create group ${keycloakGroup.name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          result.errors.push(errorMsg);
          console.error(`❌ ${errorMsg}`);
        }
      }

      return result;

    } catch (error) {
      const errorMsg = `Failed to setup groups: ${error instanceof Error ? error.message : 'Unknown error'}`;
      result.errors.push(errorMsg);
      return result;
    }
  }

  /**
   * Setup users from Keycloak to Spring
   */
  private async setupUsers(
    organizationId: string,
    onProgress?: SetupProgressCallback
  ): Promise<{ created: number; existing: number; skipped: number; errors: string[] }> {
    const result = { created: 0, existing: 0, skipped: 0, errors: [] as string[] };

    try {
      // Get existing users from both systems
      const [keycloakUsers, springUsers] = await Promise.all([
        getAdminRealmsRealmUsers(this.realm),
        getAllUserProfiles(),
      ]);

      result.existing = springUsers.length;

      // Filter Keycloak users that belong to this organization
      const orgUsers = keycloakUsers.filter(user => 
        user.attributes?.organization?.includes(organizationId)
      );

      for (let i = 0; i < orgUsers.length; i++) {
        const keycloakUser = orgUsers[i];
        
        onProgress?.({
          phase: 'users',
          message: `Processing user: ${keycloakUser.email}`,
          progress: 70 + (i / orgUsers.length) * 25,
          details: {
            processed: i,
            total: orgUsers.length,
            currentItem: keycloakUser.email,
          },
        });

        // Skip if user already exists in Spring
        const existingSpringUser = springUsers.find(
          su => su.keycloakId === keycloakUser.id
        );

        if (existingSpringUser) {
          result.skipped++;
          continue;
        }

        // Create user in Spring
        try {
          const springUser: UserProfileDTO = {
            keycloakId: keycloakUser.id!,
            firstName: keycloakUser.firstName || '',
            lastName: keycloakUser.lastName || '',
            email: keycloakUser.email || '',
            phone: this.extractPhone(keycloakUser),
            displayName: `${keycloakUser.firstName || ''} ${keycloakUser.lastName || ''}`.trim() || keycloakUser.email || '',
          };

          await createUserProfile({ data: springUser });
          result.created++;
          console.log(`✅ Created user in Spring: ${keycloakUser.email}`);

        } catch (error) {
          const errorMsg = `Failed to create user ${keycloakUser.email}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          result.errors.push(errorMsg);
          console.error(`❌ ${errorMsg}`);
        }
      }

      return result;

    } catch (error) {
      const errorMsg = `Failed to setup users: ${error instanceof Error ? error.message : 'Unknown error'}`;
      result.errors.push(errorMsg);
      return result;
    }
  }

  /**
   * Check if setup is needed
   */
  async isSetupRequired(): Promise<{
    required: boolean;
    details: {
      springRoles: number;
      springGroups: number;
      springUsers: number;
      keycloakRoles: number;
      keycloakGroups: number;
      keycloakUsers: number;
    };
  }> {
    try {
      const syncStatus = await dualStorageService.checkSyncStatus();
      
      return {
        required: !syncStatus.usersSynced || !syncStatus.groupsSynced || !syncStatus.rolesSynced,
        details: {
          springRoles: syncStatus.details.springRoles,
          springGroups: syncStatus.details.springGroups,
          springUsers: syncStatus.details.springUsers,
          keycloakRoles: syncStatus.details.keycloakRoles,
          keycloakGroups: syncStatus.details.keycloakGroups,
          keycloakUsers: syncStatus.details.keycloakUsers,
        },
      };

    } catch (error) {
      console.error('Failed to check setup requirement:', error);
      return {
        required: true,
        details: {
          springRoles: 0,
          springGroups: 0,
          springUsers: 0,
          keycloakRoles: 0,
          keycloakGroups: 0,
          keycloakUsers: 0,
        },
      };
    }
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Extract description from Keycloak group attributes
   */
  private extractDescription(group: GroupRepresentation): string {
    return group.attributes?.description?.[0] || '';
  }

  /**
   * Extract phone from Keycloak user attributes
   */
  private extractPhone(user: UserRepresentation): string {
    return user.attributes?.phone?.[0] || '';
  }
}

// Export singleton instance
export const setupService = new SetupService();
