/**
 * User Details API Route
 * Handles user information retrieval and management
 */

import { NextRequest, NextResponse } from 'next/server';
import { keycloakAdminClient, verifyAdminPermissions } from '@/lib/keycloak-admin-client';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    // Verify permissions
    const permissionCheck = await verifyAdminPermissions();
    if (!permissionCheck.authorized) {
      return NextResponse.json(
        { error: permissionCheck.error },
        { status: 401 }
      );
    }

    const { userId } = params;

    // Get user details, roles, and groups in parallel
    const [user, roles, groups] = await Promise.all([
      keycloakAdminClient.getUser(userId),
      keycloakAdminClient.getUserRoleMappings(userId),
      keycloakAdminClient.getUserGroups(userId)
    ]);

    const userDetails = {
      user,
      assignedRealmRoles: roles,
      assignedGroups: groups,
    };

    return NextResponse.json(userDetails);
  } catch (error) {
    console.error('User details API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user details' },
      { status: 500 }
    );
  }
}
