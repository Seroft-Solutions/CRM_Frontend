/**
 * User Profile Basic Info Update API Route
 * Handles updating user basic information in both Keycloak and Spring backend
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { keycloakService } from '@/core/api/services/keycloak-service';
import {
  getAdminRealmsRealmUsersUserId,
  putAdminRealmsRealmUsersUserId,
  getAdminRealmsRealmUsers,
} from '@/core/api/generated/keycloak';
import type { UserRepresentation } from '@/core/api/generated/keycloak';
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
    } catch (error) {
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
      const accessToken = await keycloakService.getAccessToken();

      const springUserProfilesResponse = await fetch(
        `${SPRING_API_URL}/api/user-profiles/search?keycloakId=${userId}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (springUserProfilesResponse.ok) {
        const profiles = await springUserProfilesResponse.json();

        if (profiles && profiles.length > 0) {
          const existingProfile = profiles[0];

          const updatedProfile: Partial<UserProfileDTO> = {
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
  } catch (error: any) {
    console.error('Profile basic info update API error:', error);

    if (error.status === 404) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (error.status === 403) {
      return NextResponse.json(
        { error: 'Access denied. Insufficient permissions.' },
        { status: 403 }
      );
    }

    if (error.status === 409) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 409 });
    }

    return NextResponse.json(
      { error: error.message || 'Failed to update user basic information' },
      { status: error.status || 500 }
    );
  }
}
