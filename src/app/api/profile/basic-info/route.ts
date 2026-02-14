/**
 * User Profile Basic Info Update API Route
 * Handles updating user basic information in both Keycloak and Spring backend
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { keycloakService } from '@/core/api/services/keycloak-service';
import type { UserRepresentation } from '@/core/api/generated/keycloak';
import {
  getAdminRealmsRealmUsers,
  getAdminRealmsRealmUsersUserId,
  putAdminRealmsRealmUsersUserId,
} from '@/core/api/generated/keycloak';
import type { UserProfileDTO } from '@/core/api/generated/spring/schemas';
import { SPRING_API_URL } from '@/core/api/config/constants';

export interface UpdateBasicInfoRequest {
  firstName: string;
  lastName: string;
  email: string;
  displayName?: string;
}

/**
 * Update user basic information in both Keycloak and Spring backend
 */
export async function PUT(request: NextRequest) {
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

    const updateData: UpdateBasicInfoRequest = await request.json();
    const { firstName, lastName, email, displayName } = updateData;

    if (!firstName || !lastName || !email) {
      return NextResponse.json(
        { error: 'First name, last name, and email are required' },
        { status: 400 }
      );
    }

    let keycloakUser: UserRepresentation | null = null;
    let userId = session.user.id;

    try {
      keycloakUser = await getAdminRealmsRealmUsersUserId(realm, userId);
    } catch {
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

    if (!keycloakUser) {
      return NextResponse.json({ error: 'User not found in Keycloak' }, { status: 404 });
    }

    const updatedKeycloakUser: UserRepresentation = {
      ...keycloakUser,
      firstName,
      lastName,
      email,

      username: email !== keycloakUser.username ? email : keycloakUser.username,
    };

    await putAdminRealmsRealmUsersUserId(realm, userId, updatedKeycloakUser);

    let springUpdateSuccess = false;

    try {
      const accessToken = session.access_token;

      if (!accessToken) {
        throw new Error('Missing access token in session');
      }

      const existingProfile = await fetchSpringProfile(accessToken, userId, email);

      if (existingProfile) {
        const updatedProfile: Partial<UserProfileDTO> = {
          id: existingProfile.id,
          firstName,
          lastName,
          email,
          displayName: displayName || `${firstName} ${lastName}`,
        };

        const updateResponse = await fetch(
          `${SPRING_API_URL}/api/user-profiles/${existingProfile.id}`,
          {
            method: 'PATCH',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(updatedProfile),
          }
        );

        springUpdateSuccess = updateResponse.ok;
      } else {
        const newProfile: Partial<UserProfileDTO> = {
          keycloakId: userId,
          firstName,
          lastName,
          email,
          displayName: displayName || `${firstName} ${lastName}`,
          status: 'ACTIVE',
        };

        const createResponse = await fetch(`${SPRING_API_URL}/api/user-profiles`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newProfile),
        });

        springUpdateSuccess = createResponse.ok;
      }
    } catch (springError) {
      console.warn(
        'Failed to update Spring backend profile, but Keycloak update succeeded:',
        springError
      );
    }

    return NextResponse.json({
      message: 'User basic information updated successfully',
      keycloakUpdated: true,
      springUpdated: springUpdateSuccess,
      userId,
    });
  } catch (error: unknown) {
    console.error('Profile basic info update API error:', error);

    const errorStatus = getErrorStatus(error);

    if (errorStatus === 404) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (errorStatus === 403) {
      return NextResponse.json(
        { error: 'Access denied. Insufficient permissions.' },
        { status: 403 }
      );
    }

    if (errorStatus === 409) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 409 });
    }

    return NextResponse.json(
      { error: getErrorMessage(error, 'Failed to update user basic information') },
      { status: errorStatus }
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
