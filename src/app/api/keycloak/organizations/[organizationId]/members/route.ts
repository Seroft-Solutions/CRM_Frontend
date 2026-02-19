/**
 * Organization Members API Route
 * Uses the unified Keycloak admin service with generated endpoints
 */

import { NextRequest, NextResponse } from 'next/server';
import { keycloakService } from '@/core/api/services/keycloak-service';
import type {
  CredentialRepresentation,
  GetAdminRealmsRealmOrganizationsOrgIdMembersParams,
  MemberRepresentation,
  PostAdminRealmsRealmOrganizationsOrgIdMembersInviteExistingUserBody,
  UserRepresentation,
} from '@/core/api/generated/keycloak';
import {
  deleteAdminRealmsRealmUsersUserIdGroupsGroupId,
  getAdminRealmsRealmGroups,
  getAdminRealmsRealmOrganizationsOrgId,
  getAdminRealmsRealmOrganizationsOrgIdMembers,
  getAdminRealmsRealmUsers,
  getAdminRealmsRealmUsersUserIdGroups,
  getAdminRealmsRealmUsersUserIdRoleMappingsRealm,
  postAdminRealmsRealmOrganizationsOrgIdMembers,
  postAdminRealmsRealmOrganizationsOrgIdMembersInviteExistingUser,
  postAdminRealmsRealmUsers,
  putAdminRealmsRealmUsersUserId,
  putAdminRealmsRealmUsersUserIdExecuteActionsEmail,
  putAdminRealmsRealmUsersUserIdGroupsGroupId,
  putAdminRealmsRealmUsersUserIdResetPassword,
} from '@/core/api/generated/keycloak';
import type {
  InvitationStatus,
  PendingInvitation,
  UserInvitationWithGroups,
} from '@/features/user-management/types';

function generateInvitationId(): string {
  return `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function createInvitationUserAttributes(invitation: PendingInvitation) {
  return {
    invitation_id: [invitation.id],
    invitation_status: [invitation.status],
    invitation_invited_by: [invitation.invitedBy],
    invitation_invited_at: [invitation.invitedAt.toString()],
    invitation_organization_id: [invitation.organizationId],
    invitation_selected_groups: [JSON.stringify(invitation.selectedGroups.map((g) => g.id))],
    invitation_note: [invitation.invitationNote || ''],
    invitation_expires_at: [invitation.expiresAt?.toString() || ''],
  };
}

const INVITE_MANAGED_GROUP_TOKENS = new Set([
  'user',
  'users',
  'salesman',
  'salesmanager',
  'admins',
]);

function normalizeGroupToken(value?: string): string {
  return (value || '').toLowerCase().replace(/[\s_-]+/g, '');
}

async function ensureProperGroupAssignment(
  realm: string,
  userId: string
): Promise<{
  usersGroupAssigned: boolean;
  adminsGroupRemoved: boolean;
}> {
  let usersGroupAssigned = false;
  let adminsGroupRemoved = false;

  try {
    const allGroups = await getAdminRealmsRealmGroups(realm);
    const usersGroup = allGroups.find((g) => g.name === 'Users');
    const adminsGroup = allGroups.find((g) => g.name === 'Admins');

    const userGroups = await getAdminRealmsRealmUsersUserIdGroups(realm, userId);

    if (usersGroup && !userGroups.some((g) => g.id === usersGroup.id)) {
      await putAdminRealmsRealmUsersUserIdGroupsGroupId(realm, userId, usersGroup.id!);
      usersGroupAssigned = true;
      console.log('Assigned Users group to user:', userId);
    }

    if (adminsGroup && userGroups.some((g) => g.id === adminsGroup.id)) {
      await deleteAdminRealmsRealmUsersUserIdGroupsGroupId(realm, userId, adminsGroup.id!);
      adminsGroupRemoved = true;
      console.log('Removed Admins group from user:', userId);
    }
  } catch (error) {
    console.warn('Failed to manage group assignments for user:', userId, error);
  }

  return { usersGroupAssigned, adminsGroupRemoved };
}

async function ensureOrganizationOwnerGroupAssignment(
  realm: string,
  userId: string
): Promise<{
  usersGroupAssigned: boolean;
  adminsGroupAssigned: boolean;
}> {
  let usersGroupAssigned = false;
  let adminsGroupAssigned = false;

  try {
    const allGroups = await getAdminRealmsRealmGroups(realm);
    const usersGroup = allGroups.find((g) => g.name === 'Users');
    const adminsGroup = allGroups.find((g) => g.name === 'Admins');

    const userGroups = await getAdminRealmsRealmUsersUserIdGroups(realm, userId);

    if (usersGroup && !userGroups.some((g) => g.id === usersGroup.id)) {
      await putAdminRealmsRealmUsersUserIdGroupsGroupId(realm, userId, usersGroup.id!);
      usersGroupAssigned = true;
      console.log('Assigned Users group to organization owner:', userId);
    }

    if (adminsGroup && !userGroups.some((g) => g.id === adminsGroup.id)) {
      await putAdminRealmsRealmUsersUserIdGroupsGroupId(realm, userId, adminsGroup.id!);
      adminsGroupAssigned = true;
      console.log('Assigned Admins group to organization owner:', userId);
    }
  } catch (error) {
    console.warn('Failed to manage group assignments for organization owner:', userId, error);
  }

  return { usersGroupAssigned, adminsGroupAssigned };
}

function parseInvitationFromUserAttributes(user: UserRepresentation): PendingInvitation | null {
  const attributes = user.attributes;
  if (!attributes?.invitation_id?.[0]) return null;

  try {
    const selectedGroupIds = JSON.parse(attributes.invitation_selected_groups?.[0] || '[]');
    return {
      id: attributes.invitation_id[0],
      email: user.email || '',
      firstName: user.firstName,
      lastName: user.lastName,
      organizationId: attributes.invitation_organization_id?.[0] || '',
      status: (attributes.invitation_status?.[0] as InvitationStatus) || 'pending',
      invitedBy: attributes.invitation_invited_by?.[0] || '',
      invitedAt: parseInt(attributes.invitation_invited_at?.[0] || '0'),
      expiresAt: attributes.invitation_expires_at?.[0]
        ? parseInt(attributes.invitation_expires_at[0])
        : undefined,
      selectedGroups: selectedGroupIds.map((id: string) => ({ id, name: '', path: '' })),
      invitationNote: attributes.invitation_note?.[0] || '',
    };
  } catch (error) {
    console.error('Failed to parse invitation metadata:', error);
    return null;
  }
}

async function setDefaultPassword(
  realm: string,
  userId: string,
  password: string = 'temp#123',
  temporary: boolean = true
) {
  const credential: CredentialRepresentation = {
    type: 'password',
    value: password,
    temporary,
  };

  try {
    await putAdminRealmsRealmUsersUserIdResetPassword(realm, userId, credential);
    console.log(`Set default password for user ${userId}`);
    return true;
  } catch (error) {
    console.error(`Failed to set default password for user ${userId}:`, error);
    return false;
  }
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
    const { searchParams } = new URL(request.url);
    const realm = keycloakService.getRealm();

    const queryParams: GetAdminRealmsRealmOrganizationsOrgIdMembersParams = {};

    if (searchParams.has('search')) {
      queryParams.search = searchParams.get('search') || undefined;
    }
    if (searchParams.has('first')) {
      queryParams.first = parseInt(searchParams.get('first') || '0', 10);
    }
    if (searchParams.has('max')) {
      queryParams.max = parseInt(searchParams.get('max') || '20', 10);
    }

    const members: MemberRepresentation[] = await getAdminRealmsRealmOrganizationsOrgIdMembers(
      realm,
      organizationId,
      queryParams
    );

    const enhancedMembers = await Promise.all(
      members.map(async (member) => {
        try {
          if (!member.id) return member;

          const [memberGroups, memberRoles] = await Promise.all([
            getAdminRealmsRealmUsersUserIdGroups(realm, member.id).catch((error) => {
              console.warn(`Failed to fetch groups for user ${member.id}:`, error);
              return [];
            }),
            getAdminRealmsRealmUsersUserIdRoleMappingsRealm(realm, member.id).catch((error) => {
              console.warn(`Failed to fetch roles for user ${member.id}:`, error);
              return [];
            }),
          ]);

          return {
            ...member,
            groups: memberGroups.map((g) => g.name).filter(Boolean),
            groupDetails: memberGroups,
            realmRoles: memberRoles.map((r) => r.name).filter(Boolean),
            roleDetails: memberRoles,
          };
        } catch (error) {
          console.warn(`Failed to enhance member data for ${member.id}:`, error);
          return member;
        }
      })
    );

    const filteredMembers = enhancedMembers.filter((member) => {
      const memberGroups = member.groups || [];
      const memberRoles = member.realmRoles || [];

      const hasBusinessPartnerGroup = memberGroups.some((groupName) => {
        const groupLower = groupName?.toLowerCase() || '';
        return (
          groupLower === 'business partners' ||
          groupLower === 'business-partners' ||
          groupLower === 'businesspartners' ||
          (groupLower.includes('business') && groupLower.includes('partner'))
        );
      });

      const hasBusinessPartnerRole = memberRoles.some((roleName) => {
        const roleLower = roleName?.toLowerCase() || '';
        return (
          roleLower === 'business partners' ||
          roleLower === 'business-partners' ||
          roleLower === 'businesspartners' ||
          (roleLower.includes('business') && roleLower.includes('partner'))
        );
      });

      const isBusinessPartner = hasBusinessPartnerGroup || hasBusinessPartnerRole;

      if (isBusinessPartner) {
        console.log('Filtering out business partner user:', {
          email: member.email,
          groups: memberGroups,
          roles: memberRoles,
        });
      }

      return !isBusinessPartner;
    });

    console.log(
      `Enhanced members API: ${members.length} total, ${filteredMembers.length} after filtering`
    );

    return NextResponse.json(filteredMembers);
  } catch (error: any) {
    console.error('Organization members API error:', error);

    if (error.status === 404) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    if (error.status === 403) {
      return NextResponse.json(
        { error: 'Access denied. Insufficient permissions.' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to fetch organization members' },
      { status: error.status || 500 }
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
    const body = await request.json();
    const realm = keycloakService.getRealm();
    const desiredPassword = typeof body.password === 'string' ? body.password : undefined;
    console.log('Route Checking avdul,', body);

    if (body.userId && !body.email) {
      console.log('Simple member addition:', { organizationId, userId: body.userId });

      await postAdminRealmsRealmOrganizationsOrgIdMembers(realm, organizationId, body.userId);

      if (body.isOrganizationOwner) {
        console.log('Setting up organization owner with admin privileges:', body.userId);

        const ownerGroupResult = await ensureOrganizationOwnerGroupAssignment(realm, body.userId);

        return NextResponse.json({
          message: 'Organization owner added successfully with admin privileges',
          organizationId,
          userId: body.userId,
          groupAssignment: {
            usersGroupAssigned: ownerGroupResult.usersGroupAssigned,
            adminsGroupAssigned: ownerGroupResult.adminsGroupAssigned,
            message: ownerGroupResult.adminsGroupAssigned
              ? 'Organization owner was assigned to both Users and Admins groups'
              : ownerGroupResult.usersGroupAssigned
                ? 'Organization owner was assigned to Users group'
                : 'Organization owner group assignments unchanged',
          },
        });
      }

      return NextResponse.json({
        message: 'User added to organization successfully',
        organizationId,
        userId: body.userId,
      });
    }

    const inviteData: UserInvitationWithGroups = {
      email: body.email,
      firstName: body.firstName,
      lastName: body.lastName,
      organizationId,
      selectedGroups: body.selectedGroups || [],
      selectedRoles: body.selectedRoles || [],
      invitationNote: body.invitationNote,
      redirectUri: body.redirectUri,
      sendWelcomeEmail: body.sendWelcomeEmail !== false,
      sendPasswordReset: body.sendPasswordReset !== false,
    };

    if (!inviteData.email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteData.email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    const organization = await getAdminRealmsRealmOrganizationsOrgId(realm, organizationId);
    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    let userId: string;
    let invitationId: string;
    let groupManagement = { usersGroupAssigned: false, adminsGroupRemoved: false };

    try {
      const existingUsers = await getAdminRealmsRealmUsers(realm, {
        email: inviteData.email,
        exact: true,
      });

      if (existingUsers.length > 0) {
        userId = existingUsers[0].id!;
        console.log('Found existing user:', userId);

        await postAdminRealmsRealmOrganizationsOrgIdMembers(realm, organizationId, userId);
        console.log('Added existing user to organization');

        if (!inviteData.selectedGroups || inviteData.selectedGroups.length === 0) {
          const groupResult = await ensureProperGroupAssignment(realm, userId);
          groupManagement.usersGroupAssigned =
            groupResult.usersGroupAssigned || groupManagement.usersGroupAssigned;
          groupManagement.adminsGroupRemoved =
            groupResult.adminsGroupRemoved || groupManagement.adminsGroupRemoved;
        }

        if (inviteData.sendPasswordReset !== false) {
          try {
            await putAdminRealmsRealmUsersUserIdExecuteActionsEmail(
              realm,
              userId,
              ['UPDATE_PASSWORD'],
              {
                client_id: 'web_app',
                lifespan: 43200,
                redirect_uri: inviteData.redirectUri,
              }
            );
            console.log('Sent UPDATE_PASSWORD email to existing user (explicitly requested)');
          } catch (emailError) {
            console.warn('Failed to send UPDATE_PASSWORD email:', emailError);
          }
        } else {
          const inviteExistingUserData: PostAdminRealmsRealmOrganizationsOrgIdMembersInviteExistingUserBody =
            {
              id: userId,
            };

          await postAdminRealmsRealmOrganizationsOrgIdMembersInviteExistingUser(
            realm,
            organizationId,
            inviteExistingUserData
          );
          console.log('Sent organization invitation email to existing user');
        }
      } else {
        const newUser: UserRepresentation = {
          username: inviteData.email,
          email: inviteData.email,
          firstName: inviteData.firstName || '',
          lastName: inviteData.lastName || '',
          enabled: true,
          emailVerified: false,
          attributes: {
            organization: [organizationId],

            organization_id: [organizationId],
            organization_name: [organization.name || 'Organization'],
            organization_display_name: [organization.name || 'Organization'],

            user_type: ['user'],
          },
        };

        await postAdminRealmsRealmUsers(realm, newUser);
        console.log('Created new user');

        const createdUsers = await getAdminRealmsRealmUsers(realm, {
          email: inviteData.email,
          exact: true,
        });

        if (createdUsers.length === 0) {
          throw new Error('Failed to find created user');
        }

        userId = createdUsers[0].id!;
        console.log('Found created user ID:', userId);

        const passwordSet = await setDefaultPassword(
          realm,
          userId,
          desiredPassword || undefined,
          desiredPassword ? false : true
        );
        if (!passwordSet) {
          console.warn('Failed to set default password, but continuing with user creation');
        }

        if (!inviteData.selectedGroups || inviteData.selectedGroups.length === 0) {
          const groupResult1 = await ensureProperGroupAssignment(realm, userId);
          groupManagement.usersGroupAssigned =
            groupResult1.usersGroupAssigned || groupManagement.usersGroupAssigned;
          groupManagement.adminsGroupRemoved =
            groupResult1.adminsGroupRemoved || groupManagement.adminsGroupRemoved;
        }

        await postAdminRealmsRealmOrganizationsOrgIdMembers(realm, organizationId, userId);
        console.log('Added user to organization');

        if (inviteData.sendPasswordReset !== false) {
          try {
            await putAdminRealmsRealmUsersUserIdExecuteActionsEmail(
              realm,
              userId,
              ['UPDATE_PASSWORD'],
              {
                client_id: 'web_app',
                lifespan: 43200,
                redirect_uri: body.redirectUri,
              }
            );
            console.log('Sent UPDATE_PASSWORD email to new user (explicitly requested)');
          } catch (emailError) {
            console.warn('Failed to send UPDATE_PASSWORD email:', emailError);
          }
        } else if (inviteData.sendWelcomeEmail !== false) {
          const inviteUserData: PostAdminRealmsRealmOrganizationsOrgIdMembersInviteExistingUserBody =
            {
              id: userId,
            };

          await postAdminRealmsRealmOrganizationsOrgIdMembersInviteExistingUser(
            realm,
            organizationId,
            inviteUserData
          );
          console.log('Sent organization invitation email to new user');
        }
      }

      if (inviteData.selectedGroups && inviteData.selectedGroups.length > 0) {
        for (const group of inviteData.selectedGroups) {
          if (!group.id) {
            continue;
          }

          try {
            await putAdminRealmsRealmUsersUserIdGroupsGroupId(realm, userId, group.id);
            console.log('Assigned group:', group.id);
          } catch (groupError) {
            console.warn('Failed to assign group:', group.id, groupError);
          }
        }

        const selectedGroupIds = new Set(
          inviteData.selectedGroups
            .map((group) => group.id)
            .filter((groupId): groupId is string => Boolean(groupId))
        );

        try {
          const currentUserGroups = await getAdminRealmsRealmUsersUserIdGroups(realm, userId);

          for (const currentGroup of currentUserGroups) {
            if (!currentGroup.id) {
              continue;
            }

            const normalizedGroupToken = normalizeGroupToken(currentGroup.name);
            const isManagedInviteGroup = INVITE_MANAGED_GROUP_TOKENS.has(normalizedGroupToken);
            const isSelectedGroup = selectedGroupIds.has(currentGroup.id);

            if (!isManagedInviteGroup || isSelectedGroup) {
              continue;
            }

            try {
              await deleteAdminRealmsRealmUsersUserIdGroupsGroupId(realm, userId, currentGroup.id);
              console.log('Removed non-selected invite group:', currentGroup.id, currentGroup.name);

              if (normalizedGroupToken === 'admins') {
                groupManagement.adminsGroupRemoved = true;
              }
            } catch (removeGroupError) {
              console.warn(
                'Failed to remove non-selected invite group:',
                currentGroup.id,
                currentGroup.name,
                removeGroupError
              );
            }
          }
        } catch (cleanupError) {
          console.warn('Failed to cleanup non-selected invite groups:', cleanupError);
        }
      }

      invitationId = generateInvitationId();
      const pendingInvitation: PendingInvitation = {
        id: invitationId,
        email: inviteData.email,
        firstName: inviteData.firstName,
        lastName: inviteData.lastName,
        organizationId,
        status: 'pending',
        invitedBy: 'current-user',
        invitedAt: Date.now(),
        expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
        selectedGroups: inviteData.selectedGroups || [],
        invitationNote: inviteData.invitationNote,
      };

      const invitationAttributes = createInvitationUserAttributes(pendingInvitation);

      const currentUser = await getAdminRealmsRealmUsers(realm, {
        email: inviteData.email,
        exact: true,
      });

      if (currentUser.length > 0) {
        const updatedUser: UserRepresentation = {
          ...currentUser[0],
          attributes: {
            ...currentUser[0].attributes,
            ...invitationAttributes,
          },
        };

        await putAdminRealmsRealmUsersUserId(realm, userId, updatedUser);
        console.log('Added invitation metadata');
      }
    } catch (error: any) {
      console.error('Invitation flow failed:', error);
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: 'User invited successfully',
      email: inviteData.email,
      firstName: inviteData.firstName,
      lastName: inviteData.lastName,
      organizationId,
      userId,
      invitationId,
      selectedGroups: inviteData.selectedGroups?.length || 0,
      emailType: inviteData.sendPasswordReset === true ? 'password_reset' : 'organization_invite',
      groupManagement: {
        usersGroupAssigned: groupManagement.usersGroupAssigned,
        adminsGroupRemoved: groupManagement.adminsGroupRemoved,
        message:
          inviteData.selectedGroups && inviteData.selectedGroups.length > 0
            ? 'User was assigned only to the selected invite group(s)'
            : groupManagement.adminsGroupRemoved
              ? 'User was removed from Admins group and assigned to Users group'
              : groupManagement.usersGroupAssigned
                ? 'User was assigned to Users group'
                : 'User group assignments unchanged',
      },
    });
  } catch (error: any) {
    console.error('Enhanced invite user API error:', error);
    console.error('Error details:', {
      status: error.status,
      statusText: error.statusText,
      message: error.message,
      response: error.response?.data,
      config: error.config
        ? {
            url: error.config.url,
            method: error.config.method,
            headers: error.config.headers,
            data: error.config.data,
          }
        : null,
    });

    if (error.status === 404) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    if (error.status === 409) {
      return NextResponse.json({ error: 'User already exists in organization' }, { status: 409 });
    }

    if (error.status === 400) {
      return NextResponse.json(
        {
          error: 'Invalid invitation data',
          details: error.response?.data || error.message,
        },
        { status: 400 }
      );
    }

    if (error.status === 403) {
      return NextResponse.json(
        { error: 'Access denied. Insufficient permissions.' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        error: error.message || 'Failed to invite user to organization',
        details: error.response?.data,
      },
      { status: error.status || 500 }
    );
  }
}
