/**
 * User Details API Route
 * Uses the unified Keycloak admin service with generated endpoints
 */

import { NextRequest, NextResponse } from 'next/server';
import { keycloakService } from '@/core/api/services/keycloak-service';
import {
  getAdminRealmsRealmUsersUserId,
  getAdminRealmsRealmUsersUserIdGroups,
  getAdminRealmsRealmUsersUserIdRoleMappingsRealm,
} from '@/core/api/generated/keycloak';
import type {
  UserRepresentation,
  GroupRepresentation,
  RoleRepresentation,
} from '@/core/api/generated/keycloak';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    // Verify admin permissions
    const permissionCheck = await keycloakService.verifyAdminPermissions();
    if (!permissionCheck.authorized) {
      return NextResponse.json({ error: permissionCheck.error }, { status: 401 });
    }

    // Await params in Next.js 15+
    const { userId } = await params;
    const realm = keycloakService.getRealm();

    if (!realm) {
      throw new Error('Realm configuration missing');
    }

    // Get user details, roles, and groups in parallel using generated endpoints
    const [user, groups, assignedRealmRoles] = await Promise.all([
      getAdminRealmsRealmUsersUserId(realm, userId),
      getAdminRealmsRealmUsersUserIdGroups(realm, userId),
      getAdminRealmsRealmUsersUserIdRoleMappingsRealm(realm, userId),
    ]);

    const userDetails = {
      user: user as UserRepresentation,
      assignedRealmRoles,
      assignedGroups: groups as GroupRepresentation[],
    };

    return NextResponse.json(userDetails);
  } catch (error: any) {
    console.error('User details API error:', error);

    // Handle specific Keycloak errors
    if (error.status === 404) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (error.status === 403) {
      return NextResponse.json(
        { error: 'Access denied. Insufficient permissions.' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to fetch user details' },
      { status: error.status || 500 }
    );
  }
}

/**
 * Update user details
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    // Verify admin permissions
    const permissionCheck = await keycloakService.verifyAdminPermissions();
    if (!permissionCheck.authorized) {
      return NextResponse.json({ error: permissionCheck.error }, { status: 401 });
    }

    // Await params in Next.js 15+
    const { userId } = await params;
    const realm = keycloakService.getRealm();

    if (!realm) {
      throw new Error('Realm configuration missing');
    }
    const userData: UserRepresentation = await request.json();

    // Validate required fields
    if (!userData.username && !userData.email) {
      return NextResponse.json({ error: 'Username or email is required' }, { status: 400 });
    }

    // Update user using generated endpoint (when available)
    // For now, use the admin service directly
    await keycloakService.adminPut(`/users/${userId}`, userData);

    return NextResponse.json({
      message: 'User updated successfully',
      userId,
    });
  } catch (error: any) {
    console.error('User update API error:', error);

    if (error.status === 404) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (error.status === 409) {
      return NextResponse.json({ error: 'Username or email already exists' }, { status: 409 });
    }

    return NextResponse.json(
      { error: error.message || 'Failed to update user' },
      { status: error.status || 500 }
    );
  }
}
