import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { keycloakService } from '@/core/api/services/keycloak-service';
import type { UserRepresentation } from '@/core/api/generated/keycloak';
import {
  getAdminRealmsRealmUsers,
  getAdminRealmsRealmUsersUserId,
  putAdminRealmsRealmUsersUserId,
} from '@/core/api/generated/keycloak';
import { SPRING_API_URL } from '@/core/api/config/constants';

interface UploadProfilePictureResponse {
  profilePicturePath: string;
  profilePictureUrl: string;
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No authenticated user found' }, { status: 401 });
    }

    const permissionCheck = await keycloakService.verifyAdminPermissions();

    if (!permissionCheck.authorized) {
      return NextResponse.json({ error: permissionCheck.error }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Profile picture file is required' }, { status: 400 });
    }

    if (file.size === 0) {
      return NextResponse.json({ error: 'File cannot be empty' }, { status: 400 });
    }

    const accessToken = session.access_token;

    if (!accessToken) {
      throw new Error('Missing access token in session');
    }

    const springFormData = new FormData();

    springFormData.append('file', file);

    const springResponse = await fetch(
      `${SPRING_API_URL}/api/user-profiles/current/profile-picture`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: springFormData,
      }
    );

    if (!springResponse.ok) {
      const errorData = await springResponse.json().catch(() => ({}));

      return NextResponse.json(
        { error: errorData.message || errorData.error || 'Failed to upload profile picture' },
        { status: springResponse.status }
      );
    }

    const uploadResult = (await springResponse.json()) as UploadProfilePictureResponse;

    const realm = keycloakService.getRealm();

    if (!realm) {
      throw new Error('Realm configuration missing');
    }

    let keycloakUpdated = false;

    try {
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

      if (keycloakUser?.id) {
        const updatedAttributes = {
          ...(keycloakUser.attributes || {}),
          avatar: [uploadResult.profilePictureUrl],
          picture: [uploadResult.profilePictureUrl],
        };

        await putAdminRealmsRealmUsersUserId(realm, userId, {
          ...keycloakUser,
          attributes: updatedAttributes,
        });

        keycloakUpdated = true;
      }
    } catch (keycloakError) {
      console.warn(
        'Profile picture uploaded, but failed to sync Keycloak avatar attributes:',
        keycloakError
      );
    }

    return NextResponse.json({
      ...uploadResult,
      keycloakUpdated,
    });
  } catch (error: unknown) {
    console.error('Profile picture upload API error:', error);

    return NextResponse.json(
      { error: getErrorMessage(error, 'Failed to upload profile picture') },
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
