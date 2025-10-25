/**
 * Organization Members API Route
 * Uses the unified Keycloak admin service with generated endpoints
 */

import { NextRequest, NextResponse } from 'next/server';
import { keycloakService } from '@/core/api/services/keycloak-service';
import {
  getAdminRealmsRealmOrganizationsOrgIdMembers,
  getAdminRealmsRealmOrganizationsOrgId,
  postAdminRealmsRealmOrganizationsOrgIdMembers,
  postAdminRealmsRealmOrganizationsOrgIdMembersInviteExistingUser,
  postAdminRealmsRealmOrganizationsOrgIdMembersInviteUser,
  getAdminRealmsRealmUsers,
  postAdminRealmsRealmUsers,
  putAdminRealmsRealmUsersUserId,
  putAdminRealmsRealmUsersUserIdGroupsGroupId,
  deleteAdminRealmsRealmUsersUserIdGroupsGroupId,
  getAdminRealmsRealmUsersUserIdGroups,
  getAdminRealmsRealmUsersUserIdRoleMappingsRealm,
  putAdminRealmsRealmUsersUserIdExecuteActionsEmail,
  putAdminRealmsRealmUsersUserIdResetPassword,
  getAdminRealmsRealmGroups,
} from '@/core/api/generated/keycloak';
import type {
  GetAdminRealmsRealmOrganizationsOrgIdMembersParams,
  PostAdminRealmsRealmOrganizationsOrgIdMembersInviteExistingUserBody,
  PostAdminRealmsRealmOrganizationsOrgIdMembersInviteUserBody,
  MemberRepresentation,
  UserRepresentation,
  GroupRepresentation,
  OrganizationRepresentation,
  CredentialRepresentation,
} from '@/core/api/generated/keycloak';
import type {
  PendingInvitation,
  UserInvitationWithGroups,
  InvitationStatus,
  OrganizationWithInvitations,
} from '@/features/user-management/types';

// Helper function to generate invitation ID
function generateInvitationId(): string {
  return `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Helper function to store invitation metadata in user attributes
function createInvitationUserAttributes(invitation: PendingInvitation) {
  return {
    invitation_id: invitation.id,
    invitation_status: invitation.status,
    invitation_invited_by: invitation.invitedBy,
    invitation_invited_at: invitation.invitedAt.toString(),
    invitation_organization_id: invitation.organizationId,
    invitation_selected_groups: JSON.stringify(invitation.selectedGroups.map((g) => g.id)),
    invitation_note: invitation.invitationNote || '',
    invitation_expires_at: invitation.expiresAt?.toString() || '',
  };
}

// Helper function to ensure Users group assignment and remove Admins group if present
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
    // Get all groups
    const allGroups = await getAdminRealmsRealmGroups(realm);
    const usersGroup = allGroups.find((g) => g.name === 'Users');
    const adminsGroup = allGroups.find((g) => g.name === 'Admins');

    // Get user's current groups
    const userGroups = await getAdminRealmsRealmUsersUserIdGroups(realm, userId);

    // Assign Users group if not already assigned
    if (usersGroup && !userGroups.some((g) => g.id === usersGroup.id)) {
      await putAdminRealmsRealmUsersUserIdGroupsGroupId(realm, userId, usersGroup.id!);
      usersGroupAssigned = true;
      console.log('Assigned Users group to user:', userId);
    }

    // Remove Admins group if present
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

// Helper function to ensure organization owner gets both Users and Admins group assignment
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
    // Get all groups
    const allGroups = await getAdminRealmsRealmGroups(realm);
    const usersGroup = allGroups.find((g) => g.name === 'Users');
    const adminsGroup = allGroups.find((g) => g.name === 'Admins');

    // Get user's current groups
    const userGroups = await getAdminRealmsRealmUsersUserIdGroups(realm, userId);

    // Assign Users group if not already assigned
    if (usersGroup && !userGroups.some((g) => g.id === usersGroup.id)) {
      await putAdminRealmsRealmUsersUserIdGroupsGroupId(realm, userId, usersGroup.id!);
      usersGroupAssigned = true;
      console.log('Assigned Users group to organization owner:', userId);
    }

    // Assign Admins group if not already assigned (this is the key difference)
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

// Helper function to parse invitation metadata from user attributes
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
      selectedGroups: selectedGroupIds.map((id: string) => ({ id, name: '', path: '' })), // Will be populated later
      invitationNote: attributes.invitation_note?.[0] || '',
    };
  } catch (error) {
    console.error('Failed to parse invitation metadata:', error);
    return null;
  }
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
    // Verify permissions using the unified service
    const permissionCheck = await keycloakService.verifyAdminPermissions();
    if (!permissionCheck.authorized) {
      return NextResponse.json({ error: permissionCheck.error }, { status: 401 });
    }

    // Await params in Next.js 15+
    const { organizationId } = await params;
    const { searchParams } = new URL(request.url);
    const realm = keycloakService.getRealm();

    // Extract and type-safe query parameters
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

    // Get organization members using generated endpoint
    const members: MemberRepresentation[] = await getAdminRealmsRealmOrganizationsOrgIdMembers(
      realm,
      organizationId,
      queryParams
    );

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
            groups: memberGroups.map((g) => g.name).filter(Boolean), // Array of group names
            groupDetails: memberGroups, // Full group objects
            realmRoles: memberRoles.map((r) => r.name).filter(Boolean), // Array of role names
            roleDetails: memberRoles, // Full role objects
          };
        } catch (error) {
          console.warn(`Failed to enhance member data for ${member.id}:`, error);
          return member;
        }
      })
    );

    // FILTER: Exclude business partner users
    const filteredMembers = enhancedMembers.filter((member) => {
      const memberGroups = member.groups || [];
      const memberRoles = member.realmRoles || [];

      // Check for business partner indicators
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

    // Enhanced error handling with proper status codes
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
    // Verify permissions using the unified service
    const permissionCheck = await keycloakService.verifyAdminPermissions();
    if (!permissionCheck.authorized) {
      return NextResponse.json({ error: permissionCheck.error }, { status: 401 });
    }

    // Await params in Next.js 15+
    const { organizationId } = await params;
    const body = await request.json();
    const realm = keycloakService.getRealm();
console.log("Route Checking avdul,",body);
    // Check if this is a simple member addition (for organization setup)
    if (body.userId && !body.email) {
      console.log('Simple member addition:', { organizationId, userId: body.userId });

      // Add existing user to organization using generated endpoint
      await postAdminRealmsRealmOrganizationsOrgIdMembers(realm, organizationId, body.userId);

      // Check if this is organization owner setup (indicated by isOrganizationOwner flag)
      if (body.isOrganizationOwner) {
        console.log('Setting up organization owner with admin privileges:', body.userId);

        // Use the organization owner group assignment function
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

    // Full invitation flow (existing functionality)
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
      sendPasswordReset: body.sendPasswordReset !== false, // Only send password reset if explicitly requested
    };

    // Validate required fields
    if (!inviteData.email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteData.email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    // Fetch organization details for multi-tenant email templates
    const organization = await getAdminRealmsRealmOrganizationsOrgId(realm, organizationId);
    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // CLEAR SCENARIO-BASED FLOW
    let userId: string;
    let invitationId: string;
    let groupManagement = { usersGroupAssigned: false, adminsGroupRemoved: false };

    try {
      // Check if user exists
      const existingUsers = await getAdminRealmsRealmUsers(realm, {
        email: inviteData.email,
        exact: true,
      });

      if (existingUsers.length > 0) {
        // SCENARIO 2: User exists - add to org then invite
        userId = existingUsers[0].id!;
        console.log('Found existing user:', userId);

        // First add user to organization
        await postAdminRealmsRealmOrganizationsOrgIdMembers(realm, organizationId, userId);
        console.log('Added existing user to organization');

        // Ensure proper group assignment for existing user too
        const groupResult = await ensureProperGroupAssignment(realm, userId);
        groupManagement.usersGroupAssigned =
          groupResult.usersGroupAssigned || groupManagement.usersGroupAssigned;
        groupManagement.adminsGroupRemoved =
          groupResult.adminsGroupRemoved || groupManagement.adminsGroupRemoved;

        // Send appropriate email - prioritize invitation over password reset
        if (inviteData.sendPasswordReset !== false) {
          // Only send UPDATE_PASSWORD email if explicitly requested
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
            console.log('Sent UPDATE_PASSWORD email to existing user (explicitly requested)');
          } catch (emailError) {
            console.warn('Failed to send UPDATE_PASSWORD email:', emailError);
          }
        } else {
          // Default: Send organization invitation email
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
        // SCENARIO 1: User doesn't exist - create then invite

        // 1. Create User first
        const newUser: UserRepresentation = {
          username: inviteData.email,
          email: inviteData.email,
          firstName: inviteData.firstName || '',
          lastName: inviteData.lastName || '',
          enabled: true,
          emailVerified: false,
          attributes: {
            organization: [organizationId],
            // Organization details for multi-tenant email templates
            organization_id: [organizationId],
            organization_name: [organization.name || 'Organization'],
            organization_display_name: [
              organization.displayName || organization.name || 'Organization',
            ],
            // User type classification
            user_type: ['user'], // Set user_type for regular users
          },
        };

        await postAdminRealmsRealmUsers(realm, newUser);
        console.log('Created new user');

        // Get created user ID
        const createdUsers = await getAdminRealmsRealmUsers(realm, {
          email: inviteData.email,
          exact: true,
        });

        if (createdUsers.length === 0) {
          throw new Error('Failed to find created user');
        }

        userId = createdUsers[0].id!;
        console.log('Found created user ID:', userId);

        // 2. Set default password for the new user
        const passwordSet = await setDefaultPassword(realm, userId);
        if (!passwordSet) {
          console.warn('Failed to set default password, but continuing with user creation');
        }

        // 3. Ensure proper group assignment (Users group + remove Admins if present)
        const groupResult1 = await ensureProperGroupAssignment(realm, userId);
        groupManagement.usersGroupAssigned =
          groupResult1.usersGroupAssigned || groupManagement.usersGroupAssigned;
        groupManagement.adminsGroupRemoved =
          groupResult1.adminsGroupRemoved || groupManagement.adminsGroupRemoved;

        // 4. Add User to organization
        await postAdminRealmsRealmOrganizationsOrgIdMembers(realm, organizationId, userId);
        console.log('Added user to organization');

        // 5. Send appropriate email - prioritize invitation over password reset
        if (inviteData.sendPasswordReset !== false) {
          // Only send UPDATE_PASSWORD email if explicitly requested
          try {
            await putAdminRealmsRealmUsersUserIdExecuteActionsEmail(
              realm,
              userId,
              ['UPDATE_PASSWORD'],
              {
                client_id: 'web_app',
                lifespan: 43200, // 12 hours
                redirect_uri: body.redirectUri, // Optional redirect after password setup
              }
            );
            console.log('Sent UPDATE_PASSWORD email to new user (explicitly requested)');
          } catch (emailError) {
            console.warn('Failed to send UPDATE_PASSWORD email:', emailError);
            // Continue with invitation flow even if email fails
          }
        } else if (inviteData.sendWelcomeEmail !== false) {
          // Default: Send organization invitation email
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

      // Common: Assign selected groups
      if (inviteData.selectedGroups && inviteData.selectedGroups.length > 0) {
        for (const group of inviteData.selectedGroups) {
          try {
            await putAdminRealmsRealmUsersUserIdGroupsGroupId(realm, userId, group.id!);
            console.log('Assigned group:', group.id);
          } catch (groupError) {
            console.warn('Failed to assign group:', group.id, groupError);
          }
        }

        // After assigning selected groups, ensure Users group is still present
        // and remove Admins group if it was accidentally selected
        const groupResult2 = await ensureProperGroupAssignment(realm, userId);
        groupManagement.usersGroupAssigned =
          groupResult2.usersGroupAssigned || groupManagement.usersGroupAssigned;
        groupManagement.adminsGroupRemoved =
          groupResult2.adminsGroupRemoved || groupManagement.adminsGroupRemoved;
      }

      // Add invitation metadata for tracking
      const invitationId = generateInvitationId();
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

      // Update user with invitation metadata
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
        message: groupManagement.adminsGroupRemoved
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

    // Enhanced error handling with specific status codes
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
