/**
 * Organization Partners API Route
 * Partner invitation with "Business Partners" group assignment
 */

import { NextRequest, NextResponse } from 'next/server';
import { keycloakService } from '@/core/api/services/keycloak-service';
import { getChannelType } from '@/core/api/generated/spring/endpoints/channel-type-resource/channel-type-resource.gen';
import type { ChannelTypeDTO } from '@/core/api/generated/spring/schemas';
import type {
  CredentialRepresentation,
  OrganizationRepresentation,
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

interface PartnerInvitation {
  email: string;
  firstName: string;
  lastName: string;
  organizationId: string;
  channelTypeId: number;
  sendWelcomeEmail: boolean;
  sendPasswordReset?: boolean;
  invitationNote?: string;
  redirectUri?: string;
}

interface PendingPartnerInvitation {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  organizationId: string;
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  invitedBy: string;
  invitedAt: number;
  expiresAt?: number;
  invitationNote?: string;
  sendWelcomeEmail?: boolean;
}

async function ensureProperPartnerGroupAssignment(
  realm: string,
  userId: string
): Promise<{
  businessPartnersGroupAssigned: boolean;
  adminsGroupRemoved: boolean;
}> {
  let businessPartnersGroupAssigned = false;
  let adminsGroupRemoved = false;

  try {
    const allGroups = await getAdminRealmsRealmGroups(realm);
    const businessPartnersGroup = allGroups.find((g) => g.name === 'Business Partners');
    const adminsGroup = allGroups.find((g) => g.name === 'Admins');

    const userGroups = await getAdminRealmsRealmUsersUserIdGroups(realm, userId);

    if (businessPartnersGroup && !userGroups.some((g) => g.id === businessPartnersGroup.id)) {
      await putAdminRealmsRealmUsersUserIdGroupsGroupId(realm, userId, businessPartnersGroup.id!);
      businessPartnersGroupAssigned = true;
      console.log('Assigned Business Partners group to user:', userId);
    }

    if (adminsGroup && userGroups.some((g) => g.id === adminsGroup.id)) {
      await deleteAdminRealmsRealmUsersUserIdGroupsGroupId(realm, userId, adminsGroup.id!);
      adminsGroupRemoved = true;
      console.log('Removed Admins group from partner user:', userId);
    }
  } catch (error) {
    console.warn('Failed to manage group assignments for partner user:', userId, error);
  }

  return { businessPartnersGroupAssigned, adminsGroupRemoved };
}

function generateInvitationId(): string {
  return `partner_inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

async function fetchChannelTypeDetails(channelTypeId: number): Promise<ChannelTypeDTO | null> {
  try {
    const channelType = await getChannelType(channelTypeId);
    return channelType;
  } catch (error) {
    console.warn(`Failed to fetch channel type ${channelTypeId}:`, error);
    return null;
  }
}

function createPartnerInvitationUserAttributes(
  invitation: PendingPartnerInvitation,
  channelTypeId: number,
  channelType?: ChannelTypeDTO | null,
  organization?: OrganizationRepresentation | null
) {
  return {
    partner_invitation_id: invitation.id,
    partner_invitation_status: invitation.status,
    partner_invitation_invited_by: invitation.invitedBy,
    partner_invitation_invited_at: invitation.invitedAt.toString(),
    partner_invitation_organization_id: invitation.organizationId,
    partner_invitation_note: invitation.invitationNote || '',
    partner_invitation_expires_at: invitation.expiresAt?.toString() || '',

    organization_id: invitation.organizationId,
    organization_name: organization?.name || 'Organization',
    organization_display_name: organization?.displayName || organization?.name || 'Organization',

    channel_type_id: channelTypeId.toString(),
    channel_type_name: channelType?.name || 'Business Partner',
    channel_type_commission_rate: channelType?.commissionRate?.toString() || '0',

    user_type: 'partner',
    invited_as: 'business_partner',
  };
}

async function setDefaultPassword(realm: string, userId: string, password: string = 'temp#123') {
  const credential: CredentialRepresentation = {
    type: 'password',
    value: password,
    temporary: true,
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
    const realm = keycloakService.getRealm();

    const members = await getAdminRealmsRealmOrganizationsOrgIdMembers(realm, organizationId);

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

    const businessPartners = enhancedMembers.filter((member) => {
      const memberGroups = member.groups || [];
      return memberGroups.includes('Business Partners');
    });

    console.log(
      `Enhanced partners API: ${members.length} total members, ${businessPartners.length} business partners`
    );

    return NextResponse.json(businessPartners);
  } catch (error: any) {
    console.error('Failed to fetch business partners:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch business partners' },
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

    const inviteData: PartnerInvitation = {
      email: body.email,
      firstName: body.firstName,
      lastName: body.lastName,
      organizationId,
      channelTypeId: body.channelTypeId,
      invitationNote: body.invitationNote,
      sendWelcomeEmail: body.sendWelcomeEmail !== false,
      sendPasswordReset: body.sendPasswordReset !== false,
      redirectUri: body.redirectUri,
    };

    if (!inviteData.email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    if (!inviteData.channelTypeId) {
      return NextResponse.json({ error: 'Channel Type is required' }, { status: 400 });
    }

    const [channelType, organization] = await Promise.all([
      fetchChannelTypeDetails(inviteData.channelTypeId),
      getAdminRealmsRealmOrganizationsOrgId(realm, organizationId),
    ]);

    if (!channelType) {
      return NextResponse.json(
        { error: 'Invalid channel type ID or channel type not found' },
        { status: 400 }
      );
    }

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteData.email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    let userId: string;
    let invitationId: string;
    let groupManagement = { businessPartnersGroupAssigned: false, adminsGroupRemoved: false };

    try {
      const existingUsers = await getAdminRealmsRealmUsers(realm, {
        email: inviteData.email,
        exact: true,
      });

      console.log(`User search for ${inviteData.email}:`, {
        found: existingUsers.length,
        users: existingUsers.map((u) => ({ id: u.id, email: u.email, username: u.username })),
      });

      if (existingUsers.length > 0) {
        userId = existingUsers[0].id!;
        console.log('Found existing partner user:', userId);

        try {
          const updatedUserAttributes: UserRepresentation = {
            ...existingUsers[0],
            attributes: {
              ...existingUsers[0].attributes,
              organization: [organizationId],

              organization_id: [organizationId],
              organization_name: [organization.name || 'Organization'],
              organization_display_name: [
                organization.displayName || organization.name || 'Organization',
              ],

              user_type: ['partner'],
              invited_as: ['business_partner'],

              channel_type_id: [inviteData.channelTypeId.toString()],
              channel_type_name: [channelType.name],
              channel_type_commission_rate: [channelType.commissionRate?.toString() || '0'],
            },
          };

          await putAdminRealmsRealmUsersUserId(realm, userId, updatedUserAttributes);
          console.log('Updated existing user with partner attributes');
        } catch (attributeError) {
          console.warn(
            'Failed to update user attributes, but continuing with invitation:',
            attributeError
          );
        }

        await postAdminRealmsRealmOrganizationsOrgIdMembers(realm, organizationId, userId);
        console.log('Added existing partner to organization');

        const groupResult = await ensureProperPartnerGroupAssignment(realm, userId);
        groupManagement.businessPartnersGroupAssigned =
          groupResult.businessPartnersGroupAssigned ||
          groupManagement.businessPartnersGroupAssigned;
        groupManagement.adminsGroupRemoved =
          groupResult.adminsGroupRemoved || groupManagement.adminsGroupRemoved;

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
            console.log('Sent UPDATE_PASSWORD email to existing partner');
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
          console.log('Invited existing partner to organization');
        }
      } else {
        const newUser: UserRepresentation = {
          username: inviteData.email,
          email: inviteData.email,
          firstName: inviteData.firstName || '',
          lastName: inviteData.lastName || '',
          enabled: true,
          emailVerified: false,
        };

        await postAdminRealmsRealmUsers(realm, newUser);
        console.log('Created new partner user');

        const createdUsers = await getAdminRealmsRealmUsers(realm, {
          email: inviteData.email,
          exact: true,
        });

        if (createdUsers.length === 0) {
          throw new Error('Failed to find created partner user');
        }

        userId = createdUsers[0].id!;
        console.log('Found created partner user ID:', userId);

        const passwordSet = await setDefaultPassword(realm, userId);
        if (!passwordSet) {
          console.warn(
            'Failed to set default password for partner, but continuing with user creation'
          );
        }

        try {
          const updatedUser: UserRepresentation = {
            ...createdUsers[0],
            attributes: {
              ...createdUsers[0].attributes,
              organization: [organizationId],

              organization_id: [organizationId],
              organization_name: [organization.name || 'Organization'],
              organization_display_name: [
                organization.displayName || organization.name || 'Organization',
              ],

              user_type: ['partner'],
              invited_as: ['business_partner'],

              channel_type_id: [inviteData.channelTypeId.toString()],
              channel_type_name: [channelType.name],
              channel_type_commission_rate: [channelType.commissionRate?.toString() || '0'],
            },
          };

          await putAdminRealmsRealmUsersUserId(realm, userId, updatedUser);
          console.log('Successfully updated user with custom attributes');
        } catch (attributeError) {
          console.warn(
            'Failed to set custom attributes, but user creation succeeded:',
            attributeError
          );
        }

        const groupResult1 = await ensureProperPartnerGroupAssignment(realm, userId);
        groupManagement.businessPartnersGroupAssigned =
          groupResult1.businessPartnersGroupAssigned ||
          groupManagement.businessPartnersGroupAssigned;
        groupManagement.adminsGroupRemoved =
          groupResult1.adminsGroupRemoved || groupManagement.adminsGroupRemoved;

        await postAdminRealmsRealmOrganizationsOrgIdMembers(realm, organizationId, userId);
        console.log('Added partner to organization');

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
            console.log('Sent UPDATE_PASSWORD email to new partner');
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
          console.log('Sent partner organization invitation email');
        }
      }

      invitationId = generateInvitationId();
      const pendingInvitation: PendingPartnerInvitation = {
        id: invitationId,
        email: inviteData.email,
        firstName: inviteData.firstName,
        lastName: inviteData.lastName,
        organizationId,
        status: 'pending',
        invitedBy: 'current-user',
        invitedAt: Date.now(),
        expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
        invitationNote: inviteData.invitationNote,
      };

      const invitationAttributes = createPartnerInvitationUserAttributes(
        pendingInvitation,
        inviteData.channelTypeId,
        channelType,
        organization
      );

      const currentUser = await getAdminRealmsRealmUsers(realm, {
        email: inviteData.email,
        exact: true,
      });

      if (currentUser.length > 0) {
        try {
          const updatedUser: UserRepresentation = {
            ...currentUser[0],
            attributes: {
              ...currentUser[0].attributes,
              ...invitationAttributes,
            },
          };

          await putAdminRealmsRealmUsersUserId(realm, userId, updatedUser);
          console.log('Added partner invitation metadata');
        } catch (metadataError) {
          console.warn(
            'Failed to add invitation metadata, but invitation succeeded:',
            metadataError
          );
        }
      }
    } catch (error: any) {
      console.error('Partner invitation flow failed:', error);
      console.error('Full error details:', {
        status: error.status,
        statusText: error.statusText,
        message: error.message,
        response: error.response?.data,
        config: error.config
          ? {
              url: error.config.url,
              method: error.config.method,
              data: error.config.data,
            }
          : null,
      });
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: 'Partner invited successfully',
      email: inviteData.email,
      userId,
      invitationId,
      partnerGroup: 'Business Partners',
      channelTypeId: inviteData.channelTypeId,
      emailType: inviteData.sendPasswordReset !== false ? 'password_reset' : 'organization_invite',
      groupManagement: {
        businessPartnersGroupAssigned: groupManagement.businessPartnersGroupAssigned,
        adminsGroupRemoved: groupManagement.adminsGroupRemoved,
        message: groupManagement.adminsGroupRemoved
          ? 'Partner was removed from Admins group and assigned to Business Partners group'
          : groupManagement.businessPartnersGroupAssigned
            ? 'Partner was assigned to Business Partners group'
            : 'Partner group assignments unchanged',
      },
    });
  } catch (error: any) {
    console.error('Partner invitation API error:', error);

    if (error.status === 404) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    if (error.status === 409) {
      return NextResponse.json(
        { error: 'Partner already exists in organization' },
        { status: 409 }
      );
    }

    if (error.status === 400) {
      return NextResponse.json(
        {
          error: 'Invalid partner invitation data',
          details: error.response?.data || error.message,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: error.message || 'Failed to invite partner to organization',
        details: error.response?.data,
      },
      { status: error.status || 500 }
    );
  }
}
