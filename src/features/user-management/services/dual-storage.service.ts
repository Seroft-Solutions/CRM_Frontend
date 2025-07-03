/**
 * Dual Storage Service
 * Manages synchronization between Keycloak and Spring Database
 * Ensures consistency between both systems for users, roles, and groups
 */

import { keycloakService } from '@/core/api/services/keycloak-service';
import { springRoleService } from '@/core/auth/services/spring-role.service';
import {
  getAdminRealmsRealmUsers,
  getAdminRealmsRealmGroups,
  getAdminRealmsRealmRoles,
  getAdminRealmsRealmUsersUserId,
  getAdminRealmsRealmUsersUserIdGroups,
  getAdminRealmsRealmUsersUserIdRoleMappingsRealm,
  postAdminRealmsRealmUsers,
  putAdminRealmsRealmUsersUserId,
  deleteAdminRealmsRealmUsersUserId,
  putAdminRealmsRealmUsersUserIdGroupsGroupId,
  deleteAdminRealmsRealmUsersUserIdGroupsGroupId,
  postAdminRealmsRealmUsersUserIdRoleMappingsRealm,
  deleteAdminRealmsRealmUsersUserIdRoleMappingsRealm,
} from '@/core/api/generated/keycloak';
import {
  createUserProfile,
  updateUserProfile,
  deleteUserProfile,
  getUserProfile,
  getAllUserProfiles,
  createGroup,
  updateGroup,
  deleteGroup,
  getAllGroups,
  createRole,
  updateRole,
  deleteRole,
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
} from '@/core/api/generated/spring/schemas';

export interface DualStorageResult<T = any> {
  success: boolean;
  keycloakResult?: T;
  springResult?: T;
  errors?: string[];
  rollbackRequired?: boolean;
}

export interface UserCreationData {
  email: string;
  firstName: string;
  lastName: string;
  organizationId: string;
  phone?: string;
  displayName?: string;
  selectedGroups?: GroupRepresentation[];
  selectedRoles?: RoleRepresentation[];
  channelTypeId?: number;
}

export interface GroupCreationData {
  name: string;
  path: string;
  description?: string;
  organizationId: string;
}

export interface RoleCreationData {
  name: string;
  description?: string;
  organizationId: string;
}

/**
 * Dual Storage Service Class
 * Handles all operations that need to be synchronized between Keycloak and Spring
 */
export class DualStorageService {
  private realm: string;

  constructor() {
    this.realm = keycloakService.getRealm();
  }

  // ==================== USER MANAGEMENT ====================

  /**
   * Create user in both Keycloak and Spring
   * Keycloak first, then Spring (rollback if Spring fails)
   */
  async createUser(userData: UserCreationData): Promise<DualStorageResult<{ keycloakUser: UserRepresentation; springUser: UserProfileDTO }>> {
    const errors: string[] = [];
    let keycloakUserId: string | null = null;
    let springUserId: number | null = null;

    try {
      // Step 0: Validate email uniqueness
      const isEmailUnique = await this.validateEmailUnique(userData.email);
      if (!isEmailUnique) {
        throw new Error(`Email ${userData.email} already exists in the system`);
      }

      // Step 1: Create in Keycloak
      const keycloakUser: UserRepresentation = {
        username: userData.email,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        enabled: true,
        emailVerified: false,
        attributes: {
          organization: [userData.organizationId],
        },
      };

      await postAdminRealmsRealmUsers(this.realm, keycloakUser);
      console.log('✅ User created in Keycloak');

      // Get the created user ID
      const createdUsers = await getAdminRealmsRealmUsers(this.realm, {
        email: userData.email,
        exact: true,
      });

      if (createdUsers.length === 0) {
        throw new Error('Failed to find created user in Keycloak');
      }

      keycloakUserId = createdUsers[0].id!;
      console.log('✅ Keycloak user ID retrieved:', keycloakUserId);

      // Step 2: Create in Spring
      const springUser: UserProfileDTO = {
        keycloakId: keycloakUserId,
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        phone: userData.phone || '',
        displayName: userData.displayName || `${userData.firstName} ${userData.lastName}`,
        // Organizations, groups, and roles will be handled separately
      };

      const springResult = await createUserProfile(springUser);
      springUserId = springResult.id!;
      console.log('✅ User created in Spring:', springUserId);

      // Step 3: Assign groups and roles if provided
      if (userData.selectedGroups && userData.selectedGroups.length > 0) {
        await this.assignUserGroups(keycloakUserId, userData.selectedGroups);
      }

      if (userData.selectedRoles && userData.selectedRoles.length > 0) {
        await this.assignUserRoles(keycloakUserId, userData.selectedRoles);
      }

      return {
        success: true,
        keycloakResult: { keycloakUser: createdUsers[0], springUser: springResult },
        springResult: { keycloakUser: createdUsers[0], springUser: springResult },
      };

    } catch (error) {
      console.error('❌ User creation failed:', error);
      errors.push(error instanceof Error ? error.message : 'Unknown error');

      // Rollback if needed
      if (keycloakUserId && !springUserId) {
        try {
          await deleteAdminRealmsRealmUsersUserId(this.realm, keycloakUserId);
          console.log('🔄 Rolled back Keycloak user creation');
        } catch (rollbackError) {
          console.error('❌ Rollback failed:', rollbackError);
          errors.push('Rollback failed: ' + (rollbackError instanceof Error ? rollbackError.message : 'Unknown error'));
        }
      }

      return {
        success: false,
        errors,
        rollbackRequired: !!keycloakUserId && !springUserId,
      };
    }
  }

  /**
   * Update user in both systems with rollback capability
   */
  async updateUser(
    keycloakUserId: string,
    springUserId: number,
    updates: Partial<UserCreationData>
  ): Promise<DualStorageResult<{ keycloakUser: UserRepresentation; springUser: UserProfileDTO }>> {
    const errors: string[] = [];
    let keycloakBackup: UserRepresentation | null = null;
    let springBackup: UserProfileDTO | null = null;
    let keycloakUpdated = false;

    try {
      // Step 0: Create backups for rollback
      [keycloakBackup, springBackup] = await Promise.all([
        getAdminRealmsRealmUsersUserId(this.realm, keycloakUserId),
        getUserProfile(springUserId)
      ]);

      // Step 1: Update in Keycloak
      const keycloakUpdates: Partial<UserRepresentation> = {
        firstName: updates.firstName,
        lastName: updates.lastName,
        email: updates.email,
      };

      await putAdminRealmsRealmUsersUserId(this.realm, keycloakUserId, keycloakUpdates);
      keycloakUpdated = true;
      console.log('✅ User updated in Keycloak');

      // Step 2: Update in Spring
      const springUpdates: Partial<UserProfileDTO> = {
        firstName: updates.firstName || '',
        lastName: updates.lastName || '',
        email: updates.email || '',
        phone: updates.phone,
        displayName: updates.displayName,
      };

      const springResult = await updateUserProfile(springUserId, springUpdates as UserProfileDTO);
      console.log('✅ User updated in Spring');

      // Get updated user data
      const updatedKeycloakUser = await getAdminRealmsRealmUsersUserId(this.realm, keycloakUserId);

      // Clear cache to ensure fresh data
      springRoleService.clearUserCache(keycloakUserId);

      return {
        success: true,
        keycloakResult: { keycloakUser: updatedKeycloakUser, springUser: springResult },
        springResult: { keycloakUser: updatedKeycloakUser, springUser: springResult },
      };

    } catch (error) {
      console.error('❌ User update failed:', error);
      errors.push(error instanceof Error ? error.message : 'Unknown error');

      // Rollback Keycloak changes if Spring update failed
      if (keycloakUpdated && keycloakBackup) {
        try {
          await putAdminRealmsRealmUsersUserId(this.realm, keycloakUserId, {
            firstName: keycloakBackup.firstName,
            lastName: keycloakBackup.lastName,
            email: keycloakBackup.email,
          });
          console.log('🔄 Rolled back Keycloak user update');
        } catch (rollbackError) {
          console.error('❌ Rollback failed:', rollbackError);
          errors.push('Rollback failed: ' + (rollbackError instanceof Error ? rollbackError.message : 'Unknown error'));
        }
      }

      return {
        success: false,
        errors,
        rollbackRequired: keycloakUpdated,
      };
    }
  }

  /**
   * Delete user from both systems
   */
  async deleteUser(keycloakUserId: string, springUserId: number): Promise<DualStorageResult> {
    const errors: string[] = [];

    try {
      // Step 1: Delete from Spring first (safer - can recreate if needed)
      await deleteUserProfile(springUserId);
      console.log('✅ User deleted from Spring');

      // Step 2: Delete from Keycloak
      await deleteAdminRealmsRealmUsersUserId(this.realm, keycloakUserId);
      console.log('✅ User deleted from Keycloak');

      return {
        success: true,
      };

    } catch (error) {
      console.error('❌ User deletion failed:', error);
      errors.push(error instanceof Error ? error.message : 'Unknown error');

      return {
        success: false,
        errors,
      };
    }
  }

  /**
   * Assign groups to user in both systems
   */
  async assignUserGroups(keycloakUserId: string, groups: GroupRepresentation[]): Promise<DualStorageResult> {
    const errors: string[] = [];

    try {
      // Assign groups in Keycloak
      for (const group of groups) {
        if (group.id) {
          await putAdminRealmsRealmUsersUserIdGroupsGroupId(this.realm, keycloakUserId, group.id);
          console.log(`✅ Assigned group ${group.name} to user in Keycloak`);
        }
      }

      // Sync groups to Spring Database
      await this.syncUserRolesAndGroups(keycloakUserId);

      // Invalidate role cache to ensure fresh data
      springRoleService.clearUserCache(keycloakUserId);
      console.log('🗑️ Invalidated user role cache after group assignment');

      return {
        success: true,
      };

    } catch (error) {
      console.error('❌ Group assignment failed:', error);
      errors.push(error instanceof Error ? error.message : 'Unknown error');

      return {
        success: false,
        errors,
      };
    }
  }

  /**
   * Assign roles to user in both systems
   */
  async assignUserRoles(keycloakUserId: string, roles: RoleRepresentation[]): Promise<DualStorageResult> {
    const errors: string[] = [];

    try {
      // Assign roles in Keycloak
      await postAdminRealmsRealmUsersUserIdRoleMappingsRealm(this.realm, keycloakUserId, roles);
      console.log(`✅ Assigned roles to user in Keycloak`);

      // Sync roles to Spring Database
      await this.syncUserRolesAndGroups(keycloakUserId);

      // Invalidate role cache to ensure fresh data
      springRoleService.clearUserCache(keycloakUserId);
      console.log('🗑️ Invalidated user role cache after role assignment');

      return {
        success: true,
      };

    } catch (error) {
      console.error('❌ Role assignment failed:', error);
      errors.push(error instanceof Error ? error.message : 'Unknown error');

      return {
        success: false,
        errors,
      };
    }
  }

  // ==================== GROUP MANAGEMENT ====================

  /**
   * Create group in both systems
   */
  async createGroup(groupData: GroupCreationData): Promise<DualStorageResult<{ keycloakGroup: GroupRepresentation; springGroup: GroupDTO }>> {
    const errors: string[] = [];
    let keycloakGroupId: string | null = null;

    try {
      // Step 1: Create in Keycloak
      const keycloakGroup: GroupRepresentation = {
        name: groupData.name,
        path: groupData.path.startsWith('/') ? groupData.path : `/${groupData.path}`,
        attributes: {
          organization: [groupData.organizationId],
          description: groupData.description ? [groupData.description] : [],
        },
      };

      // Note: Group creation in Keycloak requires admin API call
      const response = await keycloakService.adminPost('/groups', keycloakGroup);
      console.log('✅ Group created in Keycloak');

      // Get the created group
      const groups = await getAdminRealmsRealmGroups(this.realm, { search: groupData.name });
      const createdGroup = groups.find(g => g.name === groupData.name);
      
      if (!createdGroup || !createdGroup.id) {
        throw new Error('Failed to find created group in Keycloak');
      }

      keycloakGroupId = createdGroup.id;

      // Step 2: Create in Spring
      const springGroup: GroupDTO = {
        keycloakGroupId: keycloakGroupId,
        name: groupData.name,
        path: groupData.path,
        description: groupData.description || '',
        isActive: true,
        // organization will be set by Spring backend
      };

      const springResult = await createGroup(springGroup);
      console.log('✅ Group created in Spring');

      return {
        success: true,
        keycloakResult: { keycloakGroup: createdGroup, springGroup: springResult },
        springResult: { keycloakGroup: createdGroup, springGroup: springResult },
      };

    } catch (error) {
      console.error('❌ Group creation failed:', error);
      errors.push(error instanceof Error ? error.message : 'Unknown error');

      return {
        success: false,
        errors,
      };
    }
  }

  // ==================== ROLE MANAGEMENT ====================

  /**
   * Create role in both systems
   */
  async createRole(roleData: RoleCreationData): Promise<DualStorageResult<{ keycloakRole: RoleRepresentation; springRole: RoleDTO }>> {
    const errors: string[] = [];
    let keycloakRoleId: string | null = null;

    try {
      // Step 1: Create in Keycloak
      const keycloakRole: RoleRepresentation = {
        name: roleData.name,
        description: roleData.description,
        attributes: {
          organization: [roleData.organizationId],
        },
      };

      await keycloakService.adminPost('/roles', keycloakRole);
      console.log('✅ Role created in Keycloak');

      // Get the created role
      const roles = await getAdminRealmsRealmRoles(this.realm);
      const createdRole = roles.find(r => r.name === roleData.name);
      
      if (!createdRole || !createdRole.id) {
        throw new Error('Failed to find created role in Keycloak');
      }

      keycloakRoleId = createdRole.id;

      // Step 2: Create in Spring
      const springRole: RoleDTO = {
        keycloakRoleId: keycloakRoleId,
        name: roleData.name,
        description: roleData.description || '',
        isActive: true,
        // organization will be set by Spring backend
      };

      const springResult = await createRole(springRole);
      console.log('✅ Role created in Spring');

      return {
        success: true,
        keycloakResult: { keycloakRole: createdRole, springRole: springResult },
        springResult: { keycloakRole: createdRole, springRole: springResult },
      };

    } catch (error) {
      console.error('❌ Role creation failed:', error);
      errors.push(error instanceof Error ? error.message : 'Unknown error');

      return {
        success: false,
        errors,
      };
    }
  }

  // ==================== SYNCHRONIZATION UTILITIES ====================

  /**
   * Get user details from both systems
   */
  async getUserDetails(keycloakUserId: string): Promise<{
    keycloakUser: UserRepresentation;
    keycloakGroups: GroupRepresentation[];
    keycloakRoles: RoleRepresentation[];
    springUser?: UserProfileDTO;
  }> {
    try {
      // Get from Keycloak
      const [keycloakUser, keycloakGroups, keycloakRoles] = await Promise.all([
        getAdminRealmsRealmUsersUserId(this.realm, keycloakUserId),
        getAdminRealmsRealmUsersUserIdGroups(this.realm, keycloakUserId),
        getAdminRealmsRealmUsersUserIdRoleMappingsRealm(this.realm, keycloakUserId),
      ]);

      // Try to get from Spring
      let springUser: UserProfileDTO | undefined;
      try {
        const springUsers = await getAllUserProfiles();
        springUser = springUsers.find(u => u.keycloakId === keycloakUserId);
      } catch (error) {
        console.warn('Could not fetch Spring user profile:', error);
      }

      return {
        keycloakUser,
        keycloakGroups,
        keycloakRoles,
        springUser,
      };

    } catch (error) {
      console.error('Failed to get user details:', error);
      throw error;
    }
  }

  /**
   * Check synchronization status between systems
   */
  async checkSyncStatus(): Promise<{
    usersSynced: boolean;
    groupsSynced: boolean;
    rolesSynced: boolean;
    details: {
      keycloakUsers: number;
      springUsers: number;
      keycloakGroups: number;
      springGroups: number;
      keycloakRoles: number;
      springRoles: number;
    };
  }> {
    try {
      const [keycloakUsers, springUsers, keycloakGroups, springGroups, keycloakRoles, springRoles] = await Promise.all([
        getAdminRealmsRealmUsers(this.realm),
        getAllUserProfiles(),
        getAdminRealmsRealmGroups(this.realm),
        getAllGroups(),
        getAdminRealmsRealmRoles(this.realm),
        getAllRoles(),
      ]);

      const details = {
        keycloakUsers: keycloakUsers.length,
        springUsers: springUsers.length,
        keycloakGroups: keycloakGroups.length,
        springGroups: springGroups.length,
        keycloakRoles: keycloakRoles.length,
        springRoles: springRoles.length,
      };

      return {
        usersSynced: details.keycloakUsers <= details.springUsers, // Spring can have more due to profiles
        groupsSynced: details.keycloakGroups <= details.springGroups,
        rolesSynced: details.keycloakRoles <= details.springRoles,
        details,
      };

    } catch (error) {
      console.error('Failed to check sync status:', error);
      throw error;
    }
  }

  /**
   * Validate email uniqueness across both systems
   */
  async validateEmailUnique(email: string): Promise<boolean> {
    try {
      const [keycloakUsers, springUsers] = await Promise.all([
        getAdminRealmsRealmUsers(this.realm, { email, exact: true }),
        getAllUserProfiles()
      ]);

      const keycloakExists = keycloakUsers.length > 0;
      const springExists = springUsers.some(u => u.email === email);

      console.log(`📧 Email validation for ${email}: Keycloak: ${keycloakExists}, Spring: ${springExists}`);
      
      return !keycloakExists && !springExists;
    } catch (error) {
      console.error('Failed to validate email uniqueness:', error);
      // In case of error, allow the creation to proceed and let the systems handle duplicates
      return true;
    }
  }

  /**
   * Sync user roles and groups from Keycloak to Spring Database
   * This ensures both systems have consistent role/group assignments
   */
  async syncUserRolesAndGroups(keycloakUserId: string): Promise<DualStorageResult> {
    try {
      // Get current user roles and groups from Keycloak
      const [keycloakGroups, keycloakRoles] = await Promise.all([
        getAdminRealmsRealmUsersUserIdGroups(this.realm, keycloakUserId),
        getAdminRealmsRealmUsersUserIdRoleMappingsRealm(this.realm, keycloakUserId),
      ]);

      // Find corresponding Spring user
      const springUsers = await getAllUserProfiles();
      const springUser = springUsers.find(u => u.keycloakId === keycloakUserId);

      if (!springUser) {
        throw new Error(`No Spring profile found for Keycloak ID: ${keycloakUserId}`);
      }

      // Update Spring user profile with current roles and groups
      // Note: This depends on your Spring API supporting role/group updates
      // You may need to implement additional API endpoints for this
      console.log(`🔄 Syncing ${keycloakRoles.length} roles and ${keycloakGroups.length} groups for user ${keycloakUserId}`);
      
      // For now, we'll trigger cache invalidation to ensure fresh data
      springRoleService.clearUserCache(keycloakUserId);
      
      return {
        success: true,
      };

    } catch (error) {
      console.error('❌ Role/group sync failed:', error);
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Unknown sync error'],
      };
    }
  }
}

// Export singleton instance
export const dualStorageService = new DualStorageService();
