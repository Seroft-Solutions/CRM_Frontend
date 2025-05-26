/**
 * User Roles Management API Route
 * Handles role assignment and removal for users
 */

import { NextRequest, NextResponse } from 'next/server';
import { keycloakAdminClient, verifyAdminPermissions } from '@/lib/keycloak-admin-client';

export async function POST(
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
    const { roles, action } = await request.json();

    if (action === 'assign') {
      await keycloakAdminClient.assignRealmRolesToUser(userId, roles);
    } else if (action === 'unassign') {
      await keycloakAdminClient.removeRealmRolesFromUser(userId, roles);
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use "assign" or "unassign"' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('User roles API error:', error);
    return NextResponse.json(
      { error: 'Failed to manage user roles' },
      { status: 500 }
    );
  }
}
