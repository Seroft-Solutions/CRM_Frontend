/**
 * Groups API Route
 * Handles groups retrieval
 */

import { NextRequest, NextResponse } from 'next/server';
import { keycloakAdminClient, verifyAdminPermissions } from '@/lib/keycloak-admin-client';

export async function GET(request: NextRequest) {
  try {
    // Verify permissions
    const permissionCheck = await verifyAdminPermissions();
    if (!permissionCheck.authorized) {
      return NextResponse.json(
        { error: permissionCheck.error },
        { status: 401 }
      );
    }

    // Get groups
    const groups = await keycloakAdminClient.getGroups();

    return NextResponse.json(groups);
  } catch (error) {
    console.error('Groups API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch groups' },
      { status: 500 }
    );
  }
}
