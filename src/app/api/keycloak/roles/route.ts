/**
 * Roles API Route
 * Handles realm roles retrieval
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

    // Get realm roles
    const roles = await keycloakAdminClient.getRealmRoles();

    return NextResponse.json(roles);
  } catch (error) {
    console.error('Roles API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch roles' },
      { status: 500 }
    );
  }
}
