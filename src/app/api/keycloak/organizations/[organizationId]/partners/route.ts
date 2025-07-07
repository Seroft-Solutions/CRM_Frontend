/**
 * Organization Partners API Route
 * Partner invitation with "Business Partners" group assignment
 */

import { NextRequest, NextResponse } from 'next/server';
import { keycloakService } from '@/core/api/services/keycloak-service';
import {
  getAdminRealmsRealmOrganizationsOrgIdMembers,
  postAdminRealmsRealmOrganizationsOrgIdMembers,
  postAdminRealmsRealmOrganizationsOrgIdMembersInviteExistingUser,
  getAdminRealmsRealmUsers,
  postAdminRealmsRealmUsers,
  putAdminRealmsRealmUsersUserId,
  putAdminRealmsRealmUsersUserIdGroupsGroupId,
  deleteAdminRealmsRealmUsersUserIdGroupsGroupId,
  putAdminRealmsRealmUsersUserIdExecuteActionsEmail,
  putAdminRealmsRealmUsersUserIdResetPassword,
  getAdminRealmsRealmGroups,
  getAdminRealmsRealmUsersUserIdGroups,
  getAdminRealmsRealmUsersUserIdRoleMappingsRealm,
} from '@/core/api/generated/keycloak';
import type {
  PostAdminRealmsRealmOrganizationsOrgIdMembersInviteExistingUserBody,
  UserRepresentation,
  GroupRepresentation,
  CredentialRepresentation,
} from '@/core/api/generated/keycloak';

interface PartnerInvitation {
  email: string;
  firstName: string;
  lastName: string;
  organizationId: string;
  channelTypeId: number; // Add channelTypeId
  sendWelcomeEmail: boolean;
  sendPasswordReset?: boolean; // Send UPDATE_PASSWORD email
  invitationNote?: string;
  redirectUri?: string; // Post-password setup redirect
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

// Helper function to ensure Business Partners group assignment and remove Admins group if present
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
    // Get all groups
    const allGroups = await getAdminRealmsRealmGroups(realm);
    const businessPartnersGroup = allGroups.find((g) => g.name === 'Business Partners');
    const adminsGroup = allGroups.find((g) => g.name === 'Admins');

    // Get user's current groups
    const userGroups = await getAdminRealmsRealmUsersUserIdGroups(realm, userId);

    // Assign Business Partners group if not already assigned
    if (businessPartnersGroup && !userGroups.some((g) => g.id === businessPartnersGroup.id)) {
      await putAdminRealmsRealmUsersUserIdGroupsGroupId(realm, userId, businessPartnersGroup.id!);
      businessPartnersGroupAssigned = true;
      console.log('Assigned Business Partners group to user:', userId);
    }

    // Remove Admins group if present
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

// Helper function to generate invitation ID
function generateInvitationId(): string {
  return `partner_inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Helper function to store partner invitation metadata in user attributes
function createPartnerInvitationUserAttributes(
  invitation: PendingPartnerInvitation,
  channelTypeId: number
) {
  return {
    partner_invitation_id: invitation.id,
    partner_invitation_status: invitation.status,
    partner_invitation_invited_by: invitation.invitedBy,
    partner_invitation_invited_at: invitation.invitedAt.toString(),
    partner_invitation_organization_id: invitation.organizationId,
    partner_invitation_note: invitation.invitationNote || '',
    partner_invitation_expires_at: invitation.expiresAt?.toString() || '',
    channel_type_id: channelTypeId.toString(), // Ensure channelType is always stored
    user_type: 'partner',
    invited_as: 'business_partner',
  };
}

// Helper function to set default password for newly created users
async function setDefaultPassword(realm: string, userId: string, password: string = 'temp#123') {
  const credential: CredentialRepresentation = {
    type: 'password',
    value: password,
    temporary: true, // User will be required to change password
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

    // Get organization members
    const members = await getAdminRealmsRealmOrganizationsOrgIdMembers(realm, organizationId);

    // ENHANCED: Parallel processing to fetch groups and roles for all members
    const enhancedMembers = await Promise.all(
      members.map(async (member) => {
        try {
          if (!member.id) return member;

          // Fetch groups and roles in parallel for each member
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

          // Add groups and roles to member object
          return {
            ...member,
            groups: memberGroups.map(g => g.name).filter(Boolean), // Array of group names
            groupDetails: memberGroups, // Full group objects
            realmRoles: memberRoles.map(r => r.name).filter(Boolean), // Array of role names
            roleDetails: memberRoles, // Full role objects
          };
        } catch (error) {
          console.warn(`Failed to enhance member data for ${member.id}:`, error);
          return member;
        }
      })
    );

    // Filter for business partners (users with "Business Partners" group)
    const businessPartners = enhancedMembers.filter((member) => {
      const memberGroups = member.groups || [];
      return memberGroups.includes('Business Partners');
    });

    console.log(`Enhanced partners API: ${members.length} total members, ${businessPartners.length} business partners`);

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
      sendPasswordReset: body.sendPasswordReset !== false, // Default to true
      redirectUri: body.redirectUri,
    };

    // Validate required fields
    if (!inviteData.email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    if (!inviteData.channelTypeId) {
      return NextResponse.json({ error: 'Channel Type is required' }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteData.email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    // CLEAR SCENARIO-BASED FLOW FOR PARTNERS
    let userId: string;
    let invitationId: string;
    let groupManagement = { businessPartnersGroupAssigned: false, adminsGroupRemoved: false };

    try {
      // Check if user exists
      const existingUsers = await getAdminRealmsRealmUsers(realm, {
        email: inviteData.email,
        exact: true,
      });

      console.log(`User search for ${inviteData.email}:`, {
        found: existingUsers.length,
        users: existingUsers.map((u) => ({ id: u.id, email: u.email, username: u.username })),
      });

      if (existingUsers.length > 0) {
        // SCENARIO 2: User exists - add to org then invite
        userId = existingUsers[0].id!;
        console.log('Found existing partner user:', userId);

        // Try to update existing user attributes to include channelType (gracefully handle failures)
        try {
          const updatedUserAttributes: UserRepresentation = {
            ...existingUsers[0],
            attributes: {
              ...existingUsers[0].attributes,
              organization: [organizationId],
              user_type: ['partner'],
              channel_type_id: [inviteData.channelTypeId.toString()],
              invited_as: ['business_partner'],
            },
          };

          await putAdminRealmsRealmUsersUserId(realm, userId, updatedUserAttributes);
          console.log('Updated existing user with partner attributes');
        } catch (attributeError) {
          console.warn('Failed to update user attributes, but continuing with invitation:', attributeError);
          // Continue with the flow - user exists, just without updated custom attributes
        }

        // First add user to organization
        await postAdminRealmsRealmOrganizationsOrgIdMembers(realm, organizationId, userId);
        console.log('Added existing partner to organization');

        // Ensure proper group assignment for existing partner
        const groupResult = await ensureProperPartnerGroupAssignment(realm, userId);
        groupManagement.businessPartnersGroupAssigned =
          groupResult.businessPartnersGroupAssigned ||
          groupManagement.businessPartnersGroupAssigned;
        groupManagement.adminsGroupRemoved =
          groupResult.adminsGroupRemoved || groupManagement.adminsGroupRemoved;

        // Send appropriate email
        if (inviteData.sendPasswordReset !== false) {
          // Send UPDATE_PASSWORD email for partners to set their password
          try {
            await putAdminRealmsRealmUsersUserIdExecuteActionsEmail(
              realm,
              userId,
              ['UPDATE_PASSWORD'],
              {
                client_id: 'web_app',
                lifespan: 43200, // 12 hours
                redirect_uri: inviteData.redirectUri,
              }
            );
            console.log('Sent UPDATE_PASSWORD email to existing partner');
          } catch (emailError) {
            console.warn('Failed to send UPDATE_PASSWORD email:', emailError);
          }
        } else {
          // Send organization invite
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
        // SCENARIO 1: User doesn't exist - create then invite

        // 1. Create Partner User first (without custom attributes initially)
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

        // Get created user ID
        const createdUsers = await getAdminRealmsRealmUsers(realm, {
          email: inviteData.email,
          exact: true,
        });

        if (createdUsers.length === 0) {
          throw new Error('Failed to find created partner user');
        }

        userId = createdUsers[0].id!;
        console.log('Found created partner user ID:', userId);

        // 1.5. Set default password for the new partner user
        const passwordSet = await setDefaultPassword(realm, userId);
        if (!passwordSet) {
          console.warn('Failed to set default password for partner, but continuing with user creation');
        }

        // 2. Try to update user with custom attributes (gracefully handle failures)
        try {
          const updatedUser: UserRepresentation = {
            ...createdUsers[0],
            attributes: {
              ...createdUsers[0].attributes,
              organization: [organizationId],
              user_type: ['partner'],
              channel_type_id: [inviteData.channelTypeId.toString()],
              invited_as: ['business_partner'],
            },
          };

          await putAdminRealmsRealmUsersUserId(realm, userId, updatedUser);
          console.log('Successfully updated user with custom attributes');
        } catch (attributeError) {
          console.warn('Failed to set custom attributes, but user creation succeeded:', attributeError);
          // Continue with the flow - user is created, just without custom attributes
        }

        // 3. Ensure proper group assignment (Business Partners group + remove Admins if present)
        const groupResult1 = await ensureProperPartnerGroupAssignment(realm, userId);
        groupManagement.businessPartnersGroupAssigned =
          groupResult1.businessPartnersGroupAssigned ||
          groupManagement.businessPartnersGroupAssigned;
        groupManagement.adminsGroupRemoved =
          groupResult1.adminsGroupRemoved || groupManagement.adminsGroupRemoved;

        // 4. Add Partner to organization
        await postAdminRealmsRealmOrganizationsOrgIdMembers(realm, organizationId, userId);
        console.log('Added partner to organization');

        // 5. Send appropriate email based on configuration
        if (inviteData.sendPasswordReset !== false) {
          // Send UPDATE_PASSWORD email for new partners to set their password
          try {
            await putAdminRealmsRealmUsersUserIdExecuteActionsEmail(
              realm,
              userId,
              ['UPDATE_PASSWORD'],
              {
                client_id: 'web_app',
                lifespan: 43200, // 12 hours
                redirect_uri: inviteData.redirectUri,
              }
            );
            console.log('Sent UPDATE_PASSWORD email to new partner');
          } catch (emailError) {
            console.warn('Failed to send UPDATE_PASSWORD email:', emailError);
            // Continue with invitation flow even if email fails
          }
        } else if (inviteData.sendWelcomeEmail !== false) {
          // Fallback to organization invite email
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

      // Add partner invitation metadata for tracking
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
        inviteData.channelTypeId
      );

      // Update user with partner invitation metadata (gracefully handle failures)
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
          console.warn('Failed to add invitation metadata, but invitation succeeded:', metadataError);
          // Continue - the core invitation worked, just missing some metadata
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
