/**
 * User Profile Password Update API Route
 * Handles updating user password in Keycloak
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { keycloakService } from '@/core/api/services/keycloak-service';
import {
  getAdminRealmsRealmUsersUserId,
  putAdminRealmsRealmUsersUserIdResetPassword,
  getAdminRealmsRealmUsers,
} from '@/core/api/generated/keycloak';
import type { UserRepresentation, CredentialRepresentation } from '@/core/api/generated/keycloak';

export interface UpdatePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

/**
 * Update user password in Keycloak
 */
export async function PUT(request: NextRequest) {
  try {
    // Get current session
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No authenticated user found' }, { status: 401 });
    }

    // Verify admin permissions for Keycloak operations
    const permissionCheck = await keycloakService.verifyAdminPermissions();
    if (!permissionCheck.authorized) {
      return NextResponse.json({ error: permissionCheck.error }, { status: 401 });
    }

    const realm = keycloakService.getRealm();
    if (!realm) {
      throw new Error('Realm configuration missing');
    }

    const updateData: UpdatePasswordRequest = await request.json();
    const { currentPassword, newPassword } = updateData;

    // Validate required fields
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Current password and new password are required' },
        { status: 400 }
      );
    }

    // Get current Keycloak user
    let keycloakUser: UserRepresentation | null = null;
    let userId = session.user.id;

    try {
      // First try to get by user ID if it's a Keycloak ID
      keycloakUser = await getAdminRealmsRealmUsersUserId(realm, userId);
    } catch (error) {
      // If that fails, search by email to get the actual Keycloak user ID
      if (session.user.email) {
        const users = await getAdminRealmsRealmUsers(realm, {
          email: session.user.email,
          exact: true,
        });
        if (users && users.length > 0) {
          keycloakUser = users[0];
          userId = keycloakUser.id!;
        }
      }
    }

    if (!keycloakUser || !keycloakUser.username) {
      return NextResponse.json(
        { error: 'User not found or username not available' },
        { status: 404 }
      );
    }

    // Verify current password by attempting to authenticate
    try {
      await verifyCurrentPassword(keycloakUser.username, currentPassword);
    } catch (authError) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
    }

    // Create new password credential
    const passwordCredential: CredentialRepresentation = {
      type: 'password',
      value: newPassword,
      temporary: false, // User doesn't need to change password on next login
    };

    // Update password in Keycloak
    await putAdminRealmsRealmUsersUserIdResetPassword(realm, userId, passwordCredential);

    return NextResponse.json({
      message: 'Password updated successfully',
      userId,
    });
  } catch (error: any) {
    console.error('Profile password update API error:', error);

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
      { error: error.message || 'Failed to update password' },
      { status: error.status || 500 }
    );
  }
}

/**
 * Verify current password by attempting authentication
 */
async function verifyCurrentPassword(username: string, password: string): Promise<void> {
  try {
    const tokenUrl = `${process.env.AUTH_KEYCLOAK_ISSUER}/protocol/openid-connect/token`;

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'password',
        client_id: process.env.AUTH_KEYCLOAK_ID!,
        client_secret: process.env.AUTH_KEYCLOAK_SECRET!,
        username,
        password,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      if (response.status === 401 || errorData.error === 'invalid_grant') {
        throw new Error('Invalid credentials');
      }

      throw new Error('Authentication verification failed');
    }

    // If we get here, the current password is correct
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to verify current password');
  }
}
