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
  getAdminRealmsRealmGroups,
  getAdminRealmsRealmUsersUserIdGroups
} from '@/core/api/generated/keycloak';
import type { 
  PostAdminRealmsRealmOrganizationsOrgIdMembersInviteExistingUserBody,
  UserRepresentation,
  GroupRepresentation
} from '@/core/api/generated/keycloak';

interface PartnerInvitation {
  email: string;
  firstName: string;
  lastName: string;
  organizationId: string;
  sendWelcomeEmail: boolean;
  invitationNote?: string;
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

// Helper function to generate invitation ID
function generateInvitationId(): string {
  return `partner_inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Helper function to store partner invitation metadata in user attributes
function createPartnerInvitationUserAttributes(invitation: PendingPartnerInvitation) {
  return {
    'partner_invitation_id': invitation.id,
    'partner_invitation_status': invitation.status,
    'partner_invitation_invited_by': invitation.invitedBy,
    'partner_invitation_invited_at': invitation.invitedAt.toString(),
    'partner_invitation_organization_id': invitation.organizationId,
    'partner_invitation_note': invitation.invitationNote || '',
    'partner_invitation_expires_at': invitation.expiresAt?.toString() || ''
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ organizationId: string }> }
) {
  try {
    const permissionCheck = await keycloakService.verifyAdminPermissions();
    if (!permissionCheck.authorized) {
      return NextResponse.json(
        { error: permissionCheck.error },
        { status: 401 }
      );
    }

    const { organizationId } = await params;
    const realm = keycloakService.getRealm();

    // Get organization members
    const members = await getAdminRealmsRealmOrganizationsOrgIdMembers(realm, organizationId);
    
    // Filter for business partners (users with "Business Partners" group)
    const businessPartners = [];
    
    for (const member of members) {
      if (member.id) {
        try {
          const userGroups = await getAdminRealmsRealmUsersUserIdGroups(realm, member.id);
          const hasBusinessPartnersGroup = userGroups.some(group => group.name === 'Business Partners');
          
          if (hasBusinessPartnersGroup) {
            businessPartners.push(member);
          }
        } catch (error) {
          console.warn(`Failed to get groups for user ${member.id}:`, error);
        }
      }
    }

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
      return NextResponse.json(
        { error: permissionCheck.error },
        { status: 401 }
      );
    }

    const { organizationId } = await params;
    const body = await request.json();
    const realm = keycloakService.getRealm();

    const inviteData: PartnerInvitation = {
      email: body.email,
      firstName: body.firstName,
      lastName: body.lastName,
      organizationId,
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

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteData.email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // CLEAR SCENARIO-BASED FLOW FOR PARTNERS
    let userId: string;
    let invitationId: string;
    
    try {
      // Check if user exists
      const existingUsers = await getAdminRealmsRealmUsers(realm, {
        email: inviteData.email,
        exact: true
      });
      
      console.log(`User search for ${inviteData.email}:`, {
        found: existingUsers.length,
        users: existingUsers.map(u => ({ id: u.id, email: u.email, username: u.username }))
      });
      
      if (existingUsers.length > 0) {
        // SCENARIO 2: User exists - add to org then invite
        userId = existingUsers[0].id!;
        console.log('Found existing partner user:', userId);
        
        // First add user to organization
        await postAdminRealmsRealmOrganizationsOrgIdMembers(realm, organizationId, userId);
        console.log('Added existing partner to organization');
        
        // Then send invite
        const inviteExistingUserData: PostAdminRealmsRealmOrganizationsOrgIdMembersInviteExistingUserBody = {
          id: userId
        };
        
        await postAdminRealmsRealmOrganizationsOrgIdMembersInviteExistingUser(
          realm,
          organizationId,
          inviteExistingUserData
        );
        console.log('Invited existing partner to organization');
        
      } else {
        // SCENARIO 1: User doesn't exist - create then invite
        
        // 1. Create Partner User first
        const newUser: UserRepresentation = {
          username: inviteData.email,
          email: inviteData.email,
          firstName: inviteData.firstName || '',
          lastName: inviteData.lastName || '',
          enabled: true,
          emailVerified: false,
          attributes: {
            organization: [organizationId],
            user_type: ['partner'] // Mark as partner user
          }
        };

        await postAdminRealmsRealmUsers(realm, newUser);
        console.log('Created new partner user');
        
        // Get created user ID
        const createdUsers = await getAdminRealmsRealmUsers(realm, {
          email: inviteData.email,
          exact: true
        });
        
        if (createdUsers.length === 0) {
          throw new Error('Failed to find created partner user');
        }
        
        userId = createdUsers[0].id!;
        console.log('Found created partner user ID:', userId);

        // 2. Assign Business Partners Group
        const allGroups = await getAdminRealmsRealmGroups(realm);
        const businessPartnersGroup = allGroups.find(g => g.name === 'Business Partners');
        
        if (businessPartnersGroup) {
          await putAdminRealmsRealmUsersUserIdGroupsGroupId(realm, userId, businessPartnersGroup.id!);
          console.log('Assigned Business Partners group');
        } else {
          console.warn('Business Partners group not found');
        }

        // 3. Add Partner to organization
        await postAdminRealmsRealmOrganizationsOrgIdMembers(realm, organizationId, userId);
        console.log('Added partner to organization');

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
          console.log('Sent partner invitation email');
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
        expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000),
        invitationNote: inviteData.invitationNote
      };

      const invitationAttributes = createPartnerInvitationUserAttributes(pendingInvitation);
      
      // Update user with partner invitation metadata
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
        console.log('Added partner invitation metadata');
      }
      
    } catch (error: any) {
      console.error('Partner invitation flow failed:', error);
      console.error('Full error details:', {
        status: error.status,
        statusText: error.statusText,
        message: error.message,
        response: error.response?.data,
        config: error.config ? {
          url: error.config.url,
          method: error.config.method,
          data: error.config.data
        } : null
      });
      throw error;
    }

    return NextResponse.json({ 
      success: true,
      message: 'Partner invited successfully',
      email: inviteData.email,
      userId,
      invitationId,
      partnerGroup: 'Business Partners'
    });
  } catch (error: any) {
    console.error('Partner invitation API error:', error);
    
    if (error.status === 404) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
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
          details: error.response?.data || error.message 
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { 
        error: error.message || 'Failed to invite partner to organization',
        details: error.response?.data
      },
      { status: error.status || 500 }
    );
  }
}
