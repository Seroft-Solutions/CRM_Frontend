/**
 * User Profile Update Service
 * Handles updating user profile information using server-side API routes
 */

import type { UserProfileDTO } from '@/core/api/generated/spring/schemas';
import type { UserRepresentation } from '@/core/api/generated/keycloak/schemas';

export interface UpdateBasicInfoRequest {
  firstName: string;
  lastName: string;
  email: string;
  displayName?: string;
}

export interface UpdatePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface UserProfileData {
  keycloakUser: UserRepresentation | null;
  springProfile:
    | (UserProfileDTO & {
        profilePicturePath?: string | null;
        profilePictureUrl?: string | null;
      })
    | null;
  sessionUser: {
    id: string;
    email: string | null;
    name: string | null;
  };
}

export interface UploadProfilePictureResponse {
  profilePicturePath: string;
  profilePictureUrl: string;
  keycloakUpdated?: boolean;
}

/**
 * Update user basic information using server-side API
 */
export async function updateUserBasicInfo(request: UpdateBasicInfoRequest): Promise<void> {
  try {
    const response = await fetch('/api/profile/basic-info', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      throw new Error(errorData.error || 'Failed to update user information');
    }
  } catch (error) {
    console.error('Error updating user basic info:', error);
    throw new Error(
      error instanceof Error
        ? error.message
        : 'Failed to update user information. Please try again.'
    );
  }
}

/**
 * Update user password using server-side API
 */
export async function updateUserPassword(request: UpdatePasswordRequest): Promise<void> {
  try {
    const response = await fetch('/api/profile/password', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      throw new Error(errorData.error || 'Failed to update password');
    }
  } catch (error) {
    console.error('Error updating user password:', error);
    throw new Error(
      error instanceof Error ? error.message : 'Failed to update password. Please try again.'
    );
  }
}

/**
 * Upload current user profile picture using server-side API
 */
export async function uploadUserProfilePicture(file: File): Promise<UploadProfilePictureResponse> {
  try {
    const formData = new FormData();

    formData.append('file', file);

    const response = await fetch('/api/profile/picture', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      throw new Error(errorData.error || 'Failed to upload profile picture');
    }

    return (await response.json()) as UploadProfilePictureResponse;
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    throw new Error(
      error instanceof Error ? error.message : 'Failed to upload profile picture. Please try again.'
    );
  }
}

/**
 * Get current user profile data using server-side API
 */
export async function getUserProfileData(): Promise<UserProfileData | null> {
  try {
    const response = await fetch('/api/profile', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      throw new Error(errorData.error || 'Failed to fetch user profile');
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting user profile data:', error);

    return null;
  }
}

/**
 * @deprecated Use getUserProfileData() instead
 * Get current user profile from Spring backend
 */
export async function getCurrentUserProfile(_keycloakId: string): Promise<UserProfileDTO | null> {
  try {
    void _keycloakId;
    const profileData = await getUserProfileData();

    return profileData?.springProfile || null;
  } catch (error) {
    console.error('Error getting current user profile:', error);

    return null;
  }
}

/**
 * @deprecated Use getUserProfileData() instead
 * Get current user from Keycloak
 */
export async function getCurrentKeycloakUser(_userId: string): Promise<UserRepresentation | null> {
  try {
    void _userId;
    const profileData = await getUserProfileData();

    return profileData?.keycloakUser || null;
  } catch (error) {
    console.error('Error getting current Keycloak user:', error);

    return null;
  }
}
