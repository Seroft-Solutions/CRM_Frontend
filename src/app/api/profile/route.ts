/**
 * User Profile Management API Route
 * Handles user profile operations server-side to avoid CORS issues
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { keycloakService } from '@/core/api/services/keycloak-service';
import {
  getAdminRealmsRealmUsersUserId,
  getAdminRealmsRealmUsers,
} from '@/core/api/generated/keycloak';
import type { UserRepresentation } from '@/core/api/generated/keycloak';
import { SPRING_API_URL } from '@/core/api/config/constants';

/**
 * Get current user profile from both Keycloak and Spring backend
 */
export async function GET(request: NextRequest) {
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

    // Get Keycloak user data
    let keycloakUser: UserRepresentation | null = null;
    try {
      // First try to get by user ID if it's a Keycloak ID
      keycloakUser = await getAdminRealmsRealmUsersUserId(realm, session.user.id);
    } catch (error) {
      // If that fails, search by email
      if (session.user.email) {
        const users = await getAdminRealmsRealmUsers(realm, {
          email: session.user.email,
          exact: true,
        });
        keycloakUser = users && users.length > 0 ? users[0] : null;
      }
    }

    // Get Spring backend user profile
    let springProfile = null;
    try {
      const accessToken = await keycloakService.getAccessToken();
      const springResponse = await fetch(
        `${SPRING_API_URL}/api/user-profiles/search?keycloakId=${keycloakUser?.id || session.user.id}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (springResponse.ok) {
        const profiles = await springResponse.json();
        springProfile = profiles && profiles.length > 0 ? profiles[0] : null;
      }
    } catch (springError) {
      console.warn('Failed to fetch Spring profile:', springError);
    }

    return NextResponse.json({
      keycloakUser,
      springProfile,
      sessionUser: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
      },
    });
  } catch (error: any) {
    console.error('Profile API GET error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch user profile' },
      { status: error.status || 500 }
    );
  }
}
