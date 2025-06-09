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
async function ensureProperPartnerGroupAssignment(realm: string, userId: string): Promise<{
  businessPartnersGroupAssigned: boolean;
  adminsGroupRemoved: boolean;
}> {
  let businessPartnersGroupAssigned = false;
  let adminsGroupRemoved = false;
  
  try {
    // Get all groups
    const allGroups = await getAdminRealmsRealmGroups(realm);
    const businessPartnersGroup = allGroups.find(g => g.name === 'Business Partners');
    const adminsGroup = allGroups.find(g => g.name === 'Admins');
    
    // Get user's current groups
    const userGroups = await getAdminRealmsRealmUsersUserIdGroups(realm, userId);
    
    // Assign Business Partners group if not already assigned
    if (businessPartnersGroup && !userGroups.some(g => g.id === businessPartnersGroup.id)) {
      await putAdminRealmsRealmUsersUserIdGroupsGroupId(realm, userId, businessPartnersGroup.id!);
      businessPartnersGroupAssigned = true;
      console.log('Assigned Business Partners group to user:', userId);
    }
    
    // Remove Admins group if present
    if (adminsGroup && userGroups.some(g => g.id === adminsGroup.id)) {
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
      sendWelcomeEmail: body.sendWelcomeEmail !== false,
      sendPasswordReset: body.sendPasswordReset !== false, // Default to true
      redirectUri: body.redirectUri
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
    let groupManagement = { businessPartnersGroupAssigned: false, adminsGroupRemoved: false };
    
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
        
        // Ensure proper group assignment for existing partner
        const groupResult = await ensureProperPartnerGroupAssignment(realm, userId);
        groupManagement.businessPartnersGroupAssigned = groupResult.businessPartnersGroupAssigned || groupManagement.businessPartnersGroupAssigned;
        groupManagement.adminsGroupRemoved = groupResult.adminsGroupRemoved || groupManagement.adminsGroupRemoved;
        
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
                redirect_uri: inviteData.redirectUri
              }
            );
            console.log('Sent UPDATE_PASSWORD email to existing partner');
          } catch (emailError) {
            console.warn('Failed to send UPDATE_PASSWORD email:', emailError);
          }
        } else {
          // Send organization invite
          const inviteExistingUserData: PostAdminRealmsRealmOrganizationsOrgIdMembersInviteExistingUserBody = {
            id: userId
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

        // 2. Ensure proper group assignment (Business Partners group + remove Admins if present)
        const groupResult1 = await ensureProperPartnerGroupAssignment(realm, userId);
        groupManagement.businessPartnersGroupAssigned = groupResult1.businessPartnersGroupAssigned || groupManagement.businessPartnersGroupAssigned;
        groupManagement.adminsGroupRemoved = groupResult1.adminsGroupRemoved || groupManagement.adminsGroupRemoved;

        // 3. Add Partner to organization
        await postAdminRealmsRealmOrganizationsOrgIdMembers(realm, organizationId, userId);
        console.log('Added partner to organization');

        // 4. Send appropriate email based on configuration
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
                redirect_uri: inviteData.redirectUri
              }
            );
            console.log('Sent UPDATE_PASSWORD email to new partner');
          } catch (emailError) {
            console.warn('Failed to send UPDATE_PASSWORD email:', emailError);
            // Continue with invitation flow even if email fails
          }
        } else if (inviteData.sendWelcomeEmail !== false) {
          // Fallback to organization invite email
          const inviteUserData: PostAdminRealmsRealmOrganizationsOrgIdMembersInviteExistingUserBody = {
            id: userId
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
      partnerGroup: 'Business Partners',
      emailType: inviteData.sendPasswordReset !== false ? 'password_reset' : 'organization_invite',
      groupManagement: {
        businessPartnersGroupAssigned: groupManagement.businessPartnersGroupAssigned,
        adminsGroupRemoved: groupManagement.adminsGroupRemoved,
        message: groupManagement.adminsGroupRemoved 
          ? 'Partner was removed from Admins group and assigned to Business Partners group'
          : groupManagement.businessPartnersGroupAssigned 
            ? 'Partner was assigned to Business Partners group'
            : 'Partner group assignments unchanged'
      }
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
