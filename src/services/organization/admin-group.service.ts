import {
  getAdminRealmsRealmGroups,
  postAdminRealmsRealmGroups,
  putAdminRealmsRealmUsersUserIdGroupsGroupId,
  getAdminRealmsRealmUsersUserIdGroups,
} from '@/core/api/generated/keycloak';
import type { GroupRepresentation } from '@/core/api/generated/keycloak';

export interface AdminGroupAssignmentResult {
  success: boolean;
  groupId?: string;
  groupName: string;
  wasCreated: boolean;
  error?: string;
  retryAttempted?: boolean;
  verificationPassed?: boolean;
}

export class AdminGroupError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message);
    this.name = 'AdminGroupError';
  }
}

export class AdminGroupService {
  private static readonly ADMIN_GROUP_NAME = 'Admins';
  private static readonly MAX_RETRIES = 1;
  private realm: string;

  constructor() {
    this.realm = process.env.NEXT_PUBLIC_KEYCLOAK_REALM || 'crm-cup';
  }

  public async assignUserToAdminGroup(
    orgId: string,
    userId: string
  ): Promise<AdminGroupAssignmentResult> {
    const result: Partial<AdminGroupAssignmentResult> = {
      groupName: AdminGroupService.ADMIN_GROUP_NAME,
    };

    try {
      const adminGroup = await this.ensureAdminGroupExists(orgId);
      result.groupId = adminGroup.id;
      result.wasCreated = !!adminGroup.path?.endsWith(AdminGroupService.ADMIN_GROUP_NAME);

      await this.assignUserToGroup(userId, adminGroup.id!);
      result.success = true;

      const verificationPassed = await this.verifyUserGroupAssignment(userId, adminGroup.id!);
      result.verificationPassed = verificationPassed;

      if (!verificationPassed) {
        console.warn(`Verification failed for user ${userId} in group ${adminGroup.id}`);
      }

      return result as AdminGroupAssignmentResult;
    } catch (error) {
      console.error('Failed to assign user to admin group:', error);
      return {
        ...(result as AdminGroupAssignmentResult),
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async ensureAdminGroupExists(orgId: string): Promise<GroupRepresentation> {
    const existingGroup = await this.findAdminGroup(orgId);
    if (existingGroup) {
      return existingGroup;
    }
    return this.createAdminGroup(orgId);
  }

  private async findAdminGroup(orgId: string): Promise<GroupRepresentation | null> {
    try {
      const groups = await getAdminRealmsRealmGroups(this.realm, { search: AdminGroupService.ADMIN_GROUP_NAME });
      const orgGroups = groups.filter(g => g.path?.startsWith(`/${orgId}`));
      return orgGroups.find(g => g.name?.toLowerCase() === AdminGroupService.ADMIN_GROUP_NAME.toLowerCase()) || null;
    } catch (error) {
      console.error('Failed to query admin groups:', error);
      return null;
    }
  }

  private async createAdminGroup(orgId: string): Promise<GroupRepresentation> {
    const adminGroupData: GroupRepresentation = {
      name: AdminGroupService.ADMIN_GROUP_NAME,
      path: `/${orgId}/${AdminGroupService.ADMIN_GROUP_NAME}`,
    };

    try {
      await postAdminRealmsRealmGroups(this.realm, adminGroupData);
      const newGroup = await this.findAdminGroup(orgId);
      if (!newGroup) {
        throw new AdminGroupError('Failed to find created admin group');
      }
      return newGroup;
    } catch (error: any) {
      if (error.status === 409) { // Conflict, group already exists
        const newGroup = await this.findAdminGroup(orgId);
        if (newGroup) return newGroup;
      }
      throw new AdminGroupError('Failed to create admin group', error);
    }
  }

  private async assignUserToGroup(
    userId: string,
    groupId: string,
    retryCount = 0
  ): Promise<void> {
    try {
      await putAdminRealmsRealmUsersUserIdGroupsGroupId(this.realm, userId, groupId);
    } catch (error) {
      if (retryCount < AdminGroupService.MAX_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
        return this.assignUserToGroup(userId, groupId, retryCount + 1);
      }
      throw new AdminGroupError('Failed to assign user to admin group', error);
    }
  }

  public async verifyUserGroupAssignment(
    userId: string,
    groupId: string
  ): Promise<boolean> {
    try {
      const userGroups = await getAdminRealmsRealmUsersUserIdGroups(this.realm, userId);
      return userGroups.some(g => g.id === groupId);
    } catch (error) {
      console.error('Failed to verify user group assignment:', error);
      return false;
    }
  }
}
