/**
 * User Profile Management API Route
 * Handles user profile operations server-side to avoid CORS issues
 */

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { keycloakService } from '@/core/api/services/keycloak-service';
import type { UserRepresentation } from '@/core/api/generated/keycloak';
import {
  getAdminRealmsRealmUsers,
  getAdminRealmsRealmUsersUserId,
} from '@/core/api/generated/keycloak';
import { SPRING_API_URL } from '@/core/api/config/constants';

/**
 * Get current user profile from both Keycloak and Spring backend
 */
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No authenticated user found' }, { status: 401 });
    }

    const permissionCheck = await keycloakService.verifyAdminPermissions();

    if (!permissionCheck.authorized) {
      return NextResponse.json({ error: permissionCheck.error }, { status: 401 });
    }

    const realm = keycloakService.getRealm();

    if (!realm) {
      throw new Error('Realm configuration missing');
    }

    let keycloakUser: UserRepresentation | null = null;

    try {
      keycloakUser = await getAdminRealmsRealmUsersUserId(realm, session.user.id);
    } catch {
      if (session.user.email) {
        const users = await getAdminRealmsRealmUsers(realm, {
          email: session.user.email,
          exact: true,
        });

        keycloakUser = users && users.length > 0 ? users[0] : null;
      }
    }

    let springProfile = null;

    try {
      const accessToken = session.access_token;

      if (!accessToken) {
        throw new Error('Missing access token in session');
      }

      const keycloakId = keycloakUser?.id || session.user.id;
      const email = session.user.email || keycloakUser?.email || null;

      springProfile = await fetchSpringProfile(accessToken, keycloakId, email);
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
  } catch (error: unknown) {
    console.error('Profile API GET error:', error);

    return NextResponse.json(
      { error: getErrorMessage(error, 'Failed to fetch user profile') },
      { status: getErrorStatus(error) }
    );
  }
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

function getErrorStatus(error: unknown): number {
  if (typeof error === 'object' && error !== null && 'status' in error) {
    const status = (error as { status?: unknown }).status;

    if (typeof status === 'number') {
      return status;
    }
  }

  return 500;
}

async function fetchSpringProfile(accessToken: string, keycloakId: string, email: string | null) {
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  };

  const byKeycloakIdResponse = await fetch(
    `${SPRING_API_URL}/api/user-profiles?keycloakId.equals=${encodeURIComponent(keycloakId)}&page=0&size=1`,
    {
      method: 'GET',
      headers,
      cache: 'no-store',
    }
  );

  if (byKeycloakIdResponse.ok) {
    const profiles = await byKeycloakIdResponse.json();

    if (profiles && profiles.length > 0) {
      return profiles[0];
    }
  }

  const byIdResponse = await fetch(
    `${SPRING_API_URL}/api/user-profiles?id.equals=${encodeURIComponent(keycloakId)}&page=0&size=1`,
    {
      method: 'GET',
      headers,
      cache: 'no-store',
    }
  );

  if (!byIdResponse.ok) {
    return null;
  }

  const profilesById = await byIdResponse.json();

  if (profilesById && profilesById.length > 0) {
    return profilesById[0];
  }

  if (!email) {
    return null;
  }

  const byEmailResponse = await fetch(
    `${SPRING_API_URL}/api/user-profiles?email.equals=${encodeURIComponent(email)}&page=0&size=1`,
    {
      method: 'GET',
      headers,
      cache: 'no-store',
    }
  );

  if (!byEmailResponse.ok) {
    return null;
  }

  const profilesByEmail = await byEmailResponse.json();

  return profilesByEmail && profilesByEmail.length > 0 ? profilesByEmail[0] : null;
}
