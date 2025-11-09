/**
 * Organization Pending Invitations API Route
 * Handles invitation tracking and management
 */

import { NextRequest, NextResponse } from 'next/server';
import { keycloakService } from '@/core/api/services/keycloak-service';
import type { GroupRepresentation, UserRepresentation } from '@/core/api/generated/keycloak';
import {
  getAdminRealmsRealmGroups,
  getAdminRealmsRealmUsers,
  putAdminRealmsRealmUsersUserId,
  putAdminRealmsRealmUsersUserIdGroupsGroupId,
} from '@/core/api/generated/keycloak';
import type {
  InvitationFilters,
  InvitationListResponse,
  InvitationStatus,
  PendingInvitation,
} from '@/features/user-management/types';

function parseInvitationFromUserAttributes(
  user: UserRepresentation,
  groups: GroupRepresentation[]
): PendingInvitation | null {
  const attributes = user.attributes;
  if (!attributes?.invitation_id?.[0]) return null;

  try {
    const selectedGroupIds = JSON.parse(attributes.invitation_selected_groups?.[0] || '[]');
    const selectedGroups = groups.filter((g) => selectedGroupIds.includes(g.id));

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
      selectedGroups,
      invitationNote: attributes.invitation_note?.[0] || '',
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
    const permissionCheck = await keycloakService.verifyAdminPermissions();
    if (!permissionCheck.authorized) {
      return NextResponse.json({ error: permissionCheck.error }, { status: 401 });
    }

    const { organizationId } = await params;
    const { searchParams } = new URL(request.url);
    const realm = keycloakService.getRealm();

    const filters: InvitationFilters = {
      status: (searchParams.get('status')?.split(',') as InvitationStatus[]) || ['pending'],
      search: searchParams.get('search') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      size: parseInt(searchParams.get('size') || '20'),
    };

    const allUsers = await getAdminRealmsRealmUsers(realm, {
      first: 0,
      max: 1000,
    });

    console.log(`Found ${allUsers.length} total users`);

    const allGroups = await getAdminRealmsRealmGroups(realm);

    const pendingInvitations: PendingInvitation[] = allUsers
      .map((user) => {
        const invitation = parseInvitationFromUserAttributes(user, allGroups);
        if (invitation && invitation.organizationId === organizationId) {
          console.log('Found invitation:', {
            email: invitation.email,
            status: invitation.status,
            orgId: invitation.organizationId,
          });
        }
        return invitation;
      })
      .filter(
        (invitation): invitation is PendingInvitation =>
          invitation !== null &&
          invitation.organizationId === organizationId &&
          filters.status!.includes(invitation.status)
      );

    console.log(`Found ${pendingInvitations.length} pending invitations for org ${organizationId}`);

    const filteredInvitations = filters.search
      ? pendingInvitations.filter(
          (inv) =>
            inv.email.toLowerCase().includes(filters.search!.toLowerCase()) ||
            `${inv.firstName} ${inv.lastName}`.toLowerCase().includes(filters.search!.toLowerCase())
        )
      : pendingInvitations;

    const totalCount = filteredInvitations.length;
    const totalPages = Math.ceil(totalCount / filters.size!);
    const startIndex = (filters.page! - 1) * filters.size!;
    const paginatedInvitations = filteredInvitations.slice(startIndex, startIndex + filters.size!);

    const response: InvitationListResponse = {
      invitations: paginatedInvitations,
      totalCount,
      currentPage: filters.page!,
      totalPages,
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Pending invitations API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch pending invitations' },
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

    const { userId, action } = body;

    if (action === 'assign-groups' && userId) {
      const user = await getAdminRealmsRealmUsers(realm, {
        search: userId,
        exact: true,
      });

      if (user.length === 0) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      const userData = user[0];
      const invitation = parseInvitationFromUserAttributes(userData, []);

      if (!invitation || invitation.organizationId !== organizationId) {
        return NextResponse.json(
          { error: 'No valid invitation found for this user' },
          { status: 404 }
        );
      }

      for (const group of invitation.selectedGroups) {
        try {
          await putAdminRealmsRealmUsersUserIdGroupsGroupId(realm, userId, group.id!);
        } catch (groupError) {
          console.warn(`Failed to assign group ${group.id} to user ${userId}:`, groupError);
        }
      }

      const updatedAttributes = {
        ...userData.attributes,
        invitation_status: ['accepted'],
      };

      await putAdminRealmsRealmUsersUserId(realm, userId, {
        ...userData,
        attributes: updatedAttributes,
      });

      return NextResponse.json({
        success: true,
        message: 'Groups assigned successfully',
        assignedGroups: invitation.selectedGroups.length,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Invitation assignment API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process invitation assignment' },
      { status: error.status || 500 }
    );
  }
}
