/**
 * Current User API Route - Get Keycloak user details for current session
 */

import { NextRequest, NextResponse } from 'next/server';
import { keycloakService } from '@/core/api/services/keycloak-service';
import { auth } from '@/auth';
import { 
  getAdminRealmsRealmUsers
} from '@/core/api/generated/keycloak';

export async function GET(request: NextRequest) {
  try {
    // Get current session
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'No authenticated user found' },
        { status: 401 }
      );
    }

    // Verify admin permissions
    const permissionCheck = await keycloakService.verifyAdminPermissions();
    if (!permissionCheck.authorized) {
      return NextResponse.json(
        { error: permissionCheck.error },
        { status: 401 }
      );
    }

    const realm = keycloakService.getRealm();
    if (!realm) {
      throw new Error('Realm configuration missing');
    }

    // Search for user by email in Keycloak
    const users = await getAdminRealmsRealmUsers(realm, {
      email: session.user.email,
      exact: true
    });

    if (!users || users.length === 0) {
      return NextResponse.json(
        { error: 'User not found in Keycloak' },
        { status: 404 }
      );
    }

    const keycloakUser = users[0];

    return NextResponse.json({
      keycloakUserId: keycloakUser.id,
      sessionUserId: session.user.id,
      email: session.user.email,
      username: keycloakUser.username,
      firstName: keycloakUser.firstName,
      lastName: keycloakUser.lastName,
      enabled: keycloakUser.enabled
    });

  } catch (error: any) {
    console.error('Current user API error:', error);
    
    return NextResponse.json(
      { 
        error: error.message || 'Failed to get current user details'
      },
      { status: error.status || 500 }
    );
  }
}
