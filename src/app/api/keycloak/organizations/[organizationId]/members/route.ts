/**
 * Organization Members API Route
 * Uses unified Keycloak admin service with generated endpoints
 */

import { NextRequest, NextResponse } from 'next/server';
import { keycloakService } from '@/core/api/services/keycloak-service';
import { 
  getAdminRealmsRealmOrganizationsOrgIdMembers,
  postAdminRealmsRealmOrganizationsOrgIdMembers,
  postAdminRealmsRealmOrganizationsOrgIdMembersInviteExistingUser,
  postAdminRealmsRealmOrganizationsOrgIdMembersInviteUser,
  getAdminRealmsRealmUsers,
  postAdminRealmsRealmUsers,
  putAdminRealmsRealmUsersUserId,
  putAdminRealmsRealmUsersUserIdGroupsGroupId,
  getAdminRealmsRealmGroups
} from '@/core/api/generated/keycloak';
import type { 
  GetAdminRealmsRealmOrganizationsOrgIdMembersParams,
  PostAdminRealmsRealmOrganizationsOrgIdMembersInviteExistingUserBody,
  PostAdminRealmsRealmOrganizationsOrgIdMembersInviteUserBody,
  MemberRepresentation,
  UserRepresentation,
  GroupRepresentation
} from '@/core/api/generated/keycloak';
import type { 
  PendingInvitation, 
  UserInvitationWithGroups,
  InvitationStatus,
  OrganizationWithInvitations 
} from '@/features/user-management/types';

// Helper function to generate invitation ID
function generateInvitationId(): string {
  return `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Helper function to store invitation metadata in user attributes
function createInvitationUserAttributes(invitation: PendingInvitation) {
  return {
    'invitation_id': invitation.id,
    'invitation_status': invitation.status,
    'invitation_invited_by': invitation.invitedBy,
    'invitation_invited_at': invitation.invitedAt.toString(),
    'invitation_organization_id': invitation.organizationId,
    'invitation_selected_groups': JSON.stringify(invitation.selectedGroups.map(g => g.id)),
    'invitation_note': invitation.invitationNote || '',
    'invitation_expires_at': invitation.expiresAt?.toString() || ''
  };
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
      expiresAt: attributes.invitation_expires_at?.[0] ? parseInt(attributes.invitation_expires_at[0]) : undefined,
      selectedGroups: selectedGroupIds.map((id: string) => ({ id, name: '', path: '' })), // Will be populated later
      invitationNote: attributes.invitation_note?.[0] || ''
    };
  } catch (error) {
    console.error('Failed to parse invitation metadata:', error);
    return null;
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
      return NextResponse.json(
        { error: permissionCheck.error },
        { status: 401 }
      );
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

    return NextResponse.json(members);
  } catch (error: any) {
    console.error('Organization members API error:', error);
    
    // Enhanced error handling with proper status codes
    if (error.status === 404) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
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
      return NextResponse.json(
        { error: permissionCheck.error },
        { status: 401 }
      );
    }

    // Await params in Next.js 15+
    const { organizationId } = await params;
    const body = await request.json();
    const realm = keycloakService.getRealm();

    // Type-safe body validation with enhanced fields
    const inviteData: UserInvitationWithGroups = {
      email: body.email,
      firstName: body.firstName,
      lastName: body.lastName,
      organizationId,
      selectedGroups: body.selectedGroups || [],
      selectedRoles: body.selectedRoles || [],
      invitationNote: body.invitationNote,
      sendWelcomeEmail: body.sendWelcomeEmail !== false
    };

    // Validate required fields
    if (!inviteData.email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteData.email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // CLEAR SCENARIO-BASED FLOW
    let userId: string;
    let invitationId: string;
    
    try {
      // Check if user exists
      const existingUsers = await getAdminRealmsRealmUsers(realm, {
        email: inviteData.email,
        exact: true
      });
      
      if (existingUsers.length > 0) {
        // SCENARIO 2: User exists - add to org then invite
        userId = existingUsers[0].id!;
        console.log('Found existing user:', userId);
        
        // First add user to organization
        await postAdminRealmsRealmOrganizationsOrgIdMembers(realm, organizationId, userId);
        console.log('Added existing user to organization');
        
        // Then send invite
        const inviteExistingUserData: PostAdminRealmsRealmOrganizationsOrgIdMembersInviteExistingUserBody = {
          id: userId
        };
        
        await postAdminRealmsRealmOrganizationsOrgIdMembersInviteExistingUser(
          realm,
          organizationId,
          inviteExistingUserData
        );
        console.log('Invited existing user to organization');
        
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
            organization: [organizationId]
          }
        };

        await postAdminRealmsRealmUsers(realm, newUser);
        console.log('Created new user');
        
        // Get created user ID
        const createdUsers = await getAdminRealmsRealmUsers(realm, {
          email: inviteData.email,
          exact: true
        });
        
        if (createdUsers.length === 0) {
          throw new Error('Failed to find created user');
        }
        
        userId = createdUsers[0].id!;
        console.log('Found created user ID:', userId);

        // 2. Assign Users Group
        const allGroups = await getAdminRealmsRealmGroups(realm);
        const usersGroup = allGroups.find(g => g.name === 'Users');
        
        if (usersGroup) {
          await putAdminRealmsRealmUsersUserIdGroupsGroupId(realm, userId, usersGroup.id!);
          console.log('Assigned Users group');
        }

        // 3. Add User to organization
        await postAdminRealmsRealmOrganizationsOrgIdMembers(realm, organizationId, userId);
        console.log('Added user to organization');

        // 4. Send invite (optional email)
        if (inviteData.sendWelcomeEmail !== false) {
          const inviteUserData: PostAdminRealmsRealmOrganizationsOrgIdMembersInviteExistingUserBody = {
            id: userId
          };
          
          await postAdminRealmsRealmOrganizationsOrgIdMembersInviteExistingUser(
            realm,
            organizationId,
            inviteUserData
          );
          console.log('Sent invitation email');
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
        expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000),
        selectedGroups: inviteData.selectedGroups || [],
        invitationNote: inviteData.invitationNote
      };

      const invitationAttributes = createInvitationUserAttributes(pendingInvitation);
      
      // Update user with invitation metadata
      const currentUser = await getAdminRealmsRealmUsers(realm, {
        email: inviteData.email,
        exact: true
      });
      
      if (currentUser.length > 0) {
        const updatedUser: UserRepresentation = {
          ...currentUser[0],
          attributes: {
            ...currentUser[0].attributes,
            ...invitationAttributes
          }
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
      userId,
      invitationId,
      selectedGroups: inviteData.selectedGroups?.length || 0
    });
  } catch (error: any) {
    console.error('Enhanced invite user API error:', error);
    console.error('Error details:', {
      status: error.status,
      statusText: error.statusText,
      message: error.message,
      response: error.response?.data,
      config: error.config ? {
        url: error.config.url,
        method: error.config.method,
        headers: error.config.headers,
        data: error.config.data
      } : null
    });
    
    // Enhanced error handling with specific status codes
    if (error.status === 404) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }
    
    if (error.status === 409) {
      return NextResponse.json(
        { error: 'User already exists in organization' },
        { status: 409 }
      );
    }
    
    if (error.status === 400) {
      return NextResponse.json(
        { 
          error: 'Invalid invitation data', 
          details: error.response?.data || error.message 
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
        details: error.response?.data
      },
      { status: error.status || 500 }
    );
  }
}
