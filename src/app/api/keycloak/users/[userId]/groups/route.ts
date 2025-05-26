/**
 * User Groups Management API Route
 * Handles group assignment and removal for users
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
    const { groups, action } = await request.json();

    for (const group of groups) {
      if (action === 'assign') {
        await keycloakAdminClient.addUserToGroup(userId, group.id);
      } else if (action === 'unassign') {
        await keycloakAdminClient.removeUserFromGroup(userId, group.id);
      } else {
        return NextResponse.json(
          { error: 'Invalid action. Use "assign" or "unassign"' },
          { status: 400 }
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('User groups API error:', error);
    return NextResponse.json(
      { error: 'Failed to manage user groups' },
      { status: 500 }
    );
  }
}
