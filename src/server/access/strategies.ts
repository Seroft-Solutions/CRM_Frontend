import {
  getAdminRealmsRealmGroups,
  getAdminRealmsRealmRoles,
  getAdminRealmsRealmUsersUserId,
  postAdminRealmsRealmUsersUserIdRoleMappingsRealm,
  putAdminRealmsRealmUsersUserIdGroupsGroupId,
  deleteAdminRealmsRealmUsersUserIdGroupsGroupId,
} from '@/core/api/generated/keycloak';
import type {
  GroupRepresentation,
  RoleRepresentation,
  UserRepresentation,
} from '@/core/api/generated/keycloak';
import { keycloakService } from '@/core/api/services/keycloak-service';
import type {
  AccessGroupDescriptor,
  AccessRoleDescriptor,
  PartnerAccessMetadata,
  StaffAccessMetadata,
} from './types';

interface StrategyContext<TMetadata> {
  user: UserRepresentation;
  metadata: TMetadata;
  organizationId: string;
}

async function fetchGroups(
  realm: string,
  groupIds: string[]
): Promise<GroupRepresentation[]> {
  if (groupIds.length === 0) return [];
  const groups = await getAdminRealmsRealmGroups(realm);
  const idSet = new Set(groupIds);
  return groups.filter((group) => group.id && idSet.has(group.id));
}

async function fetchRoles(
  realm: string,
  roleIds: string[]
): Promise<RoleRepresentation[]> {
  if (roleIds.length === 0) return [];
  const roles = await getAdminRealmsRealmRoles(realm, { max: 200 });
  const idSet = new Set(roleIds);
  return roles.filter((role) => role.id && idSet.has(role.id));
}

async function assignGroups(
  realm: string,
  userId: string,
  groupIds: string[]
) {
  for (const groupId of groupIds) {
    await putAdminRealmsRealmUsersUserIdGroupsGroupId(realm, userId, groupId);
  }
}

async function removeGroups(
  realm: string,
  userId: string,
  groupIds: string[]
) {
  for (const groupId of groupIds) {
    await deleteAdminRealmsRealmUsersUserIdGroupsGroupId(realm, userId, groupId);
  }
}

export class StaffAccessStrategy {
  async execute(context: StrategyContext<StaffAccessMetadata>) {
    const realm = keycloakService.getRealm();
    const refreshedUser = await getAdminRealmsRealmUsersUserId(realm, context.user.id!);

    const groupIds = context.metadata.groups.map((group) => group.id);
    const resolvedGroups = await fetchGroups(realm, groupIds);
    await assignGroups(
      realm,
      refreshedUser.id!,
      resolvedGroups.map((group) => group.id!)
    );

    // Handle optional roles
    const roleIds = context.metadata.roles?.map((role) => role.id) ?? [];
    const resolvedRoles = await fetchRoles(realm, roleIds);
    if (resolvedRoles.length > 0) {
      await postAdminRealmsRealmUsersUserIdRoleMappingsRealm(
        realm,
        refreshedUser.id!,
        resolvedRoles
      );
    }

    return {
      appliedGroups: resolvedGroups.map<AccessGroupDescriptor>((group) => ({
        id: group.id!,
        name: group.name ?? undefined,
      })),
      appliedRoles: resolvedRoles.map<AccessRoleDescriptor>((role) => ({
        id: role.id!,
        name: role.name ?? undefined,
      })),
    };
  }
}

export class PartnerAccessStrategy {
  private businessPartnerGroupNames = ['business partners', 'business-partners'];

  async execute(context: StrategyContext<PartnerAccessMetadata>) {
    const realm = keycloakService.getRealm();
    const refreshedUser = await getAdminRealmsRealmUsersUserId(realm, context.user.id!);

    const allGroups = await getAdminRealmsRealmGroups(realm);
    const businessPartnerGroup = allGroups.find((group) =>
      this.businessPartnerGroupNames.includes(group.name?.toLowerCase() ?? '')
    );

    // Start with requested groups (if any) and always add Business Partner group
    const requestedGroupIds = new Set(
      context.metadata.groups?.map((group) => group.id) ?? []
    );
    if (businessPartnerGroup?.id) {
      requestedGroupIds.add(businessPartnerGroup.id);
    }

    await assignGroups(realm, refreshedUser.id!, Array.from(requestedGroupIds));

    // Remove from Admins group if accidentally added
    const adminsGroup = allGroups.find(
      (group) => group.name?.toLowerCase() === 'admins'
    );
    if (adminsGroup?.id) {
      await removeGroups(realm, refreshedUser.id!, [adminsGroup.id]);
    }

    const appliedGroups = allGroups
      .filter((group) => group.id && requestedGroupIds.has(group.id))
      .map<AccessGroupDescriptor>((group) => ({
        id: group.id!,
        name: group.name ?? undefined,
      }));

    return {
      appliedGroups,
      appliedRoles: [],
    };
  }
}

export const staffAccessStrategy = new StaffAccessStrategy();
export const partnerAccessStrategy = new PartnerAccessStrategy();
