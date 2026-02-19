import { NextRequest, NextResponse } from 'next/server';
import { keycloakService } from '@/core/api/services/keycloak-service';
import type {
  GroupRepresentation,
  MemberRepresentation,
  UserRepresentation,
} from '@/core/api/generated/keycloak';
import {
  deleteAdminRealmsRealmUsersUserIdGroupsGroupId,
  getAdminRealmsRealmGroups,
  getAdminRealmsRealmGroupsGroupIdChildren,
  getAdminRealmsRealmGroupsGroupIdMembers,
  getAdminRealmsRealmOrganizationsOrgIdMembers,
  getAdminRealmsRealmUsersUserIdGroups,
  postAdminRealmsRealmGroupsGroupIdChildren,
  putAdminRealmsRealmUsersUserIdGroupsGroupId,
} from '@/core/api/generated/keycloak';

const MANAGER_USER_ID_ATTRIBUTE = 'managerUserId';

const SALESMAN_GROUP_TOKENS = new Set(['salesman', 'salesmen']);
const SALES_MANAGER_GROUP_TOKENS = new Set(['salesmanager', 'salesmanagers']);

type UserSummary = {
  id: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  enabled?: boolean;
  fullName: string;
};

type OrganizationMemberWithGroups = {
  member: MemberRepresentation & { id: string };
  groups: GroupRepresentation[];
};

type ChildGroupWithMembers = {
  group: GroupRepresentation & { id: string };
  members: UserRepresentation[];
};

function normalizeToken(value?: string): string {
  return (value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function isSalesManagerGroupName(value?: string): boolean {
  return SALES_MANAGER_GROUP_TOKENS.has(normalizeToken(value));
}

function isSalesmanGroupName(value?: string): boolean {
  return SALESMAN_GROUP_TOKENS.has(normalizeToken(value));
}

function hasGroup(
  groups: GroupRepresentation[],
  matcher: (groupName?: string) => boolean
): boolean {
  return groups.some((group) => matcher(group.name));
}

function toDisplayName(user: {
  firstName?: string;
  lastName?: string;
  username?: string;
  email?: string;
}): string {
  const name = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();

  return name || user.username || user.email || 'Unknown User';
}

function toUserSummary(user?: {
  id?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  enabled?: boolean;
}): UserSummary | null {
  if (!user?.id) {
    return null;
  }

  return {
    id: user.id,
    username: user.username,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    enabled: user.enabled,
    fullName: toDisplayName(user),
  };
}

function dedupeByUserId(users: UserSummary[]): UserSummary[] {
  const seen = new Set<string>();
  const deduped: UserSummary[] = [];

  for (const user of users) {
    if (seen.has(user.id)) {
      continue;
    }
    seen.add(user.id);
    deduped.push(user);
  }

  return deduped;
}

function getErrorMessage(error: unknown, fallbackMessage: string): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as { message?: unknown }).message === 'string'
  ) {
    return (error as { message: string }).message;
  }

  return fallbackMessage;
}

function getErrorStatus(error: unknown): number {
  if (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    typeof (error as { status?: unknown }).status === 'number'
  ) {
    return (error as { status: number }).status;
  }

  return 500;
}

function getManagerUserIdFromChildGroup(
  childGroup: ChildGroupWithMembers,
  salesManagerIds: Set<string>
): string | undefined {
  const managerUserIdFromAttribute = childGroup.group.attributes?.[MANAGER_USER_ID_ATTRIBUTE]?.[0];

  if (managerUserIdFromAttribute) {
    return managerUserIdFromAttribute;
  }

  return childGroup.members.find((member) => member.id && salesManagerIds.has(member.id))?.id;
}

function createManagerChildGroupName(
  manager: MemberRepresentation,
  existingChildGroups: ChildGroupWithMembers[]
): string {
  const baseName = toDisplayName(manager).slice(0, 70);
  const preferredName = `SM - ${baseName}`;
  const normalizedPreferredName = normalizeToken(preferredName);

  const existingNames = new Set(
    existingChildGroups.map((childGroup) => normalizeToken(childGroup.group.name))
  );

  if (!existingNames.has(normalizedPreferredName)) {
    return preferredName;
  }

  const idSuffix = manager.id?.slice(0, 8) || Date.now().toString();

  return `${preferredName}-${idSuffix}`;
}

async function getOrganizationMembersWithGroups(
  realm: string,
  organizationId: string
): Promise<OrganizationMemberWithGroups[]> {
  const members = await getAdminRealmsRealmOrganizationsOrgIdMembers(realm, organizationId, {
    first: 0,
    max: 1000,
  });

  const membersWithIds = members.filter((member): member is MemberRepresentation & { id: string } =>
    Boolean(member.id)
  );

  return Promise.all(
    membersWithIds.map(async (member) => {
      const groups = await getAdminRealmsRealmUsersUserIdGroups(realm, member.id).catch(() => []);

      return { member, groups };
    })
  );
}

async function getSalesManagerRootGroup(
  realm: string
): Promise<(GroupRepresentation & { id: string }) | null> {
  const groups = await getAdminRealmsRealmGroups(realm, {
    first: 0,
    max: 500,
    briefRepresentation: false,
  });

  const salesManagerGroup = groups.find((group) => group.id && isSalesManagerGroupName(group.name));

  if (!salesManagerGroup?.id) {
    return null;
  }

  return salesManagerGroup as GroupRepresentation & { id: string };
}

async function getChildGroupsWithMembers(
  realm: string,
  parentGroupId: string
): Promise<ChildGroupWithMembers[]> {
  const children = await getAdminRealmsRealmGroupsGroupIdChildren(realm, parentGroupId, {
    first: 0,
    max: 500,
    briefRepresentation: false,
  });

  const childrenWithIds = children.filter((group): group is GroupRepresentation & { id: string } =>
    Boolean(group.id)
  );

  return Promise.all(
    childrenWithIds.map(async (group) => {
      const members = await getAdminRealmsRealmGroupsGroupIdMembers(realm, group.id, {
        first: 0,
        max: 1000,
        briefRepresentation: true,
      }).catch(() => []);

      return { group, members };
    })
  );
}

function getChildGroupMemberIndex(childGroups: ChildGroupWithMembers[]): Map<string, string> {
  const index = new Map<string, string>();

  for (const childGroup of childGroups) {
    for (const member of childGroup.members) {
      if (!member.id) {
        continue;
      }

      if (!index.has(member.id)) {
        index.set(member.id, childGroup.group.id);
      }
    }
  }

  return index;
}

async function ensureManagerChildGroup(
  realm: string,
  salesManagerRootGroupId: string,
  manager: MemberRepresentation & { id: string },
  existingChildGroups: ChildGroupWithMembers[],
  salesManagerIds: Set<string>
): Promise<ChildGroupWithMembers> {
  const existing = existingChildGroups.find(
    (childGroup) => getManagerUserIdFromChildGroup(childGroup, salesManagerIds) === manager.id
  );

  if (existing) {
    return existing;
  }

  const childGroupName = createManagerChildGroupName(manager, existingChildGroups);

  await postAdminRealmsRealmGroupsGroupIdChildren(realm, salesManagerRootGroupId, {
    name: childGroupName,
    attributes: {
      [MANAGER_USER_ID_ATTRIBUTE]: [manager.id],
      managerUsername: [manager.username || ''],
      managerEmail: [manager.email || ''],
      managerDisplayName: [toDisplayName(manager)],
    },
  });

  const updatedChildGroups = await getChildGroupsWithMembers(realm, salesManagerRootGroupId);

  const createdGroup = updatedChildGroups.find(
    (childGroup) => getManagerUserIdFromChildGroup(childGroup, salesManagerIds) === manager.id
  );

  if (!createdGroup) {
    throw new Error('Failed to create manager child group in Keycloak');
  }

  await putAdminRealmsRealmUsersUserIdGroupsGroupId(realm, manager.id, createdGroup.group.id).catch(
    () => undefined
  );

  return createdGroup;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ organizationId: string }> }
) {
  try {
    const permissionCheck = await keycloakService.verifyAdminPermissions();

    if (!permissionCheck.authorized) {
      return NextResponse.json({ error: permissionCheck.error }, { status: 401 });
    }

    const { organizationId } = await params;
    const realm = keycloakService.getRealm();

    const membersWithGroups = await getOrganizationMembersWithGroups(realm, organizationId);

    const salesManagers = membersWithGroups.filter((memberWithGroups) =>
      hasGroup(memberWithGroups.groups, isSalesManagerGroupName)
    );
    const salesmen = membersWithGroups.filter(
      (memberWithGroups) =>
        hasGroup(memberWithGroups.groups, isSalesmanGroupName) &&
        !hasGroup(memberWithGroups.groups, isSalesManagerGroupName)
    );

    const salesManagerRootGroup = await getSalesManagerRootGroup(realm);

    if (!salesManagerRootGroup) {
      return NextResponse.json(
        {
          error: 'Sales Manager group was not found in Keycloak',
        },
        { status: 404 }
      );
    }

    const childGroups = await getChildGroupsWithMembers(realm, salesManagerRootGroup.id);
    const salesManagerIds = new Set<string>(
      salesManagers.map((memberWithGroups) => memberWithGroups.member.id)
    );
    const salespersonIds = new Set<string>(
      salesmen.map((memberWithGroups) => memberWithGroups.member.id)
    );
    const memberById = new Map(
      membersWithGroups.map((memberWithGroups) => [
        memberWithGroups.member.id,
        memberWithGroups.member,
      ])
    );

    const memberChildGroupIndex = getChildGroupMemberIndex(childGroups);

    const availableSalesmen = dedupeByUserId(
      salesmen
        .filter((memberWithGroups) => !memberChildGroupIndex.has(memberWithGroups.member.id))
        .map((memberWithGroups) => toUserSummary(memberWithGroups.member))
        .filter((user): user is UserSummary => Boolean(user))
    ).sort((left, right) => left.fullName.localeCompare(right.fullName));

    const salesManagerRows: Array<
      UserSummary & {
        assignedGroupId?: string;
        assignedGroupName?: string;
        assignedSalesmen: UserSummary[];
      }
    > = [];

    for (const memberWithGroups of salesManagers) {
      const managerSummary = toUserSummary(memberWithGroups.member);

      if (!managerSummary) {
        continue;
      }

      const childGroup = childGroups.find(
        (candidate) =>
          getManagerUserIdFromChildGroup(candidate, salesManagerIds) === memberWithGroups.member.id
      );

      const assignedSalesmen = dedupeByUserId(
        (childGroup?.members || [])
          .filter((member) => member.id && salespersonIds.has(member.id))
          .map((member) => {
            const organizationMember = member.id ? memberById.get(member.id) : undefined;

            return toUserSummary(organizationMember || member);
          })
          .filter((user): user is UserSummary => Boolean(user))
      ).sort((left, right) => left.fullName.localeCompare(right.fullName));

      salesManagerRows.push({
        ...managerSummary,
        assignedGroupId: childGroup?.group.id,
        assignedGroupName: childGroup?.group.name,
        assignedSalesmen,
      });
    }

    salesManagerRows.sort((left, right) => left.fullName.localeCompare(right.fullName));

    return NextResponse.json({
      salesManagerGroup: {
        id: salesManagerRootGroup.id,
        name: salesManagerRootGroup.name || 'Sales Manager',
        path: salesManagerRootGroup.path,
      },
      salesManagers: salesManagerRows,
      availableSalesmen,
    });
  } catch (error: unknown) {
    console.error('Sales manager assignments GET API error:', error);

    return NextResponse.json(
      { error: getErrorMessage(error, 'Failed to fetch sales manager assignments') },
      { status: getErrorStatus(error) }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ organizationId: string }> }
) {
  try {
    const permissionCheck = await keycloakService.verifyAdminPermissions();

    if (!permissionCheck.authorized) {
      return NextResponse.json({ error: permissionCheck.error }, { status: 401 });
    }

    const { organizationId } = await params;
    const realm = keycloakService.getRealm();
    const body = await request.json();

    const action = String(body?.action || 'assign')
      .trim()
      .toLowerCase();
    const managerUserId = String(body?.managerUserId || '').trim();
    const salesmanUserIds: string[] = Array.isArray(body?.salesmanUserIds)
      ? (body.salesmanUserIds as unknown[])
          .map((userId: unknown) => String(userId || '').trim())
          .filter((userId: string) => Boolean(userId))
      : [];

    const uniqueSalesmanUserIds: string[] = [...new Set<string>(salesmanUserIds)];

    if (!managerUserId) {
      return NextResponse.json({ error: 'managerUserId is required' }, { status: 400 });
    }

    if (action !== 'assign' && action !== 'unassign') {
      return NextResponse.json({ error: 'action must be assign or unassign' }, { status: 400 });
    }

    if (uniqueSalesmanUserIds.length === 0) {
      return NextResponse.json(
        { error: 'At least one salesmanUserId is required' },
        { status: 400 }
      );
    }

    const membersWithGroups = await getOrganizationMembersWithGroups(realm, organizationId);
    const memberWithGroupsById = new Map(
      membersWithGroups.map((memberWithGroups) => [memberWithGroups.member.id, memberWithGroups])
    );

    const manager = memberWithGroupsById.get(managerUserId);

    if (!manager) {
      return NextResponse.json(
        { error: 'Sales manager user was not found in this organization' },
        { status: 404 }
      );
    }

    if (!hasGroup(manager.groups, isSalesManagerGroupName)) {
      return NextResponse.json(
        { error: 'Selected user is not in the Sales Manager group' },
        { status: 400 }
      );
    }

    const usersNotInOrganization = uniqueSalesmanUserIds.filter(
      (userId) => !memberWithGroupsById.has(userId)
    );

    if (usersNotInOrganization.length > 0) {
      return NextResponse.json(
        {
          error: 'One or more selected users do not belong to this organization',
          usersNotInOrganization,
        },
        { status: 400 }
      );
    }

    const invalidSalesmanIds = uniqueSalesmanUserIds.filter((userId) => {
      const user = memberWithGroupsById.get(userId);

      return !user || !hasGroup(user.groups, isSalesmanGroupName);
    });

    if (action === 'assign' && invalidSalesmanIds.length > 0) {
      return NextResponse.json(
        {
          error: 'One or more selected users are not valid salesmen for this organization',
          invalidSalesmanIds,
        },
        { status: 400 }
      );
    }

    const salesManagerRootGroup = await getSalesManagerRootGroup(realm);

    if (!salesManagerRootGroup) {
      return NextResponse.json(
        {
          error: 'Sales Manager group was not found in Keycloak',
        },
        { status: 404 }
      );
    }

    const existingChildGroups = await getChildGroupsWithMembers(realm, salesManagerRootGroup.id);
    const salesManagerIds = new Set<string>(
      membersWithGroups
        .filter((memberWithGroups) => hasGroup(memberWithGroups.groups, isSalesManagerGroupName))
        .map((memberWithGroups) => memberWithGroups.member.id)
    );

    const existingManagerChildGroup = existingChildGroups.find(
      (candidate) =>
        getManagerUserIdFromChildGroup(candidate, salesManagerIds) === manager.member.id
    );

    const managerChildGroup =
      action === 'assign'
        ? await ensureManagerChildGroup(
            realm,
            salesManagerRootGroup.id,
            manager.member,
            existingChildGroups,
            salesManagerIds
          )
        : existingManagerChildGroup;

    if (!managerChildGroup) {
      return NextResponse.json({
        success: true,
        message: 'No salesman assigned to this sales manager',
        action,
        managerGroup: null,
        assignedUserIds: [],
        unassignedUserIds: [],
        failedAssignments: [],
      });
    }

    if (action === 'assign') {
      const refreshedChildGroups = await getChildGroupsWithMembers(realm, salesManagerRootGroup.id);
      const memberChildGroupIndex = getChildGroupMemberIndex(refreshedChildGroups);

      const conflicts = uniqueSalesmanUserIds
        .map((salesmanUserId) => ({
          salesmanUserId,
          assignedGroupId: memberChildGroupIndex.get(salesmanUserId),
        }))
        .filter(
          (conflict) =>
            conflict.assignedGroupId && conflict.assignedGroupId !== managerChildGroup.group.id
        );

      if (conflicts.length > 0) {
        return NextResponse.json(
          {
            error: 'One or more selected salesmen are already assigned to another sales manager',
            conflicts,
          },
          { status: 409 }
        );
      }
    }

    const managerGroupMemberIds = new Set(
      managerChildGroup.members.map((member) => member.id).filter(Boolean) as string[]
    );
    const usersToProcess =
      action === 'assign'
        ? uniqueSalesmanUserIds.filter(
            (salesmanUserId) => !managerGroupMemberIds.has(salesmanUserId)
          )
        : uniqueSalesmanUserIds.filter((salesmanUserId) =>
            managerGroupMemberIds.has(salesmanUserId)
          );

    const failedAssignments: Array<{ userId: string; error: string }> = [];
    const assignedUserIds: string[] = [];
    const unassignedUserIds: string[] = [];

    for (const salesmanUserId of usersToProcess) {
      try {
        if (action === 'assign') {
          await putAdminRealmsRealmUsersUserIdGroupsGroupId(
            realm,
            salesmanUserId,
            managerChildGroup.group.id
          );
          assignedUserIds.push(salesmanUserId);
        } else {
          await deleteAdminRealmsRealmUsersUserIdGroupsGroupId(
            realm,
            salesmanUserId,
            managerChildGroup.group.id
          );
          unassignedUserIds.push(salesmanUserId);
        }
      } catch (error: unknown) {
        failedAssignments.push({
          userId: salesmanUserId,
          error: getErrorMessage(
            error,
            action === 'assign' ? 'Failed to assign salesman' : 'Failed to unassign salesman'
          ),
        });
      }
    }

    const success = failedAssignments.length === 0;

    return NextResponse.json({
      success,
      message: success
        ? action === 'assign'
          ? `${assignedUserIds.length} salesman assigned successfully`
          : `${unassignedUserIds.length} salesman unassigned successfully`
        : action === 'assign'
          ? `${assignedUserIds.length} salesman assigned, ${failedAssignments.length} failed`
          : `${unassignedUserIds.length} salesman unassigned, ${failedAssignments.length} failed`,
      action,
      managerGroup: {
        id: managerChildGroup.group.id,
        name: managerChildGroup.group.name,
      },
      assignedUserIds,
      unassignedUserIds,
      failedAssignments,
    });
  } catch (error: unknown) {
    console.error('Sales manager assignments POST API error:', error);

    return NextResponse.json(
      { error: getErrorMessage(error, 'Failed to assign salesmen to manager') },
      { status: getErrorStatus(error) }
    );
  }
}
