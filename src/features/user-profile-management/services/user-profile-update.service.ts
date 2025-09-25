/**
 * User Profile Update Service
 * Handles updating user profile information in both Spring backend and Keycloak
 */

import { keycloakService } from '@/core/api/services/keycloak-service';
import {
  putAdminRealmsRealmUsersUserId,
  putAdminRealmsRealmUsersUserIdResetPassword,
  getAdminRealmsRealmUsersUserId,
} from '@/core/api/generated/keycloak/endpoints/users/users.gen';
import type { UserRepresentation, CredentialRepresentation } from '@/core/api/generated/keycloak/schemas';
import {
  useGetUserProfile,
  useUpdateUserProfile,
  usePartialUpdateUserProfile,
} from '@/core/api/generated/spring/endpoints/user-profile-resource/user-profile-resource.gen';
import type { UserProfileDTO } from '@/core/api/generated/spring/schemas';

export interface UpdateBasicInfoRequest {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  displayName?: string;
}

export interface UpdatePasswordRequest {
  userId: string;
  currentPassword: string;
  newPassword: string;
}

/**
 * Update user basic information in both Keycloak and Spring backend
 */
export async function updateUserBasicInfo(request: UpdateBasicInfoRequest): Promise<void> {
  const { userId, firstName, lastName, email, displayName } = request;
  
  try {
    const realm = keycloakService.getRealm();
    
    // First, get the current user data from Keycloak
    const currentKeycloakUser = await getAdminRealmsRealmUsersUserId(realm, userId);
    
    if (!currentKeycloakUser) {
      throw new Error('User not found in Keycloak');
    }

    // Update user in Keycloak
    const updatedKeycloakUser: UserRepresentation = {
      ...currentKeycloakUser,
      firstName,
      lastName,
      email,
      // Update username with email if it's different
      username: email !== currentKeycloakUser.username ? email : currentKeycloakUser.username,
    };

    await putAdminRealmsRealmUsersUserId(realm, userId, updatedKeycloakUser);

    // Now update user profile in Spring backend
    try {
      // Try to get existing user profile by keycloakId
      const springUserProfiles = await fetch(`${process.env.NEXT_PUBLIC_SPRING_API_URL}/api/user-profiles/search?keycloakId=${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${await getAccessToken()}`,
          'Content-Type': 'application/json',
        },
      });

      if (springUserProfiles.ok) {
        const profiles = await springUserProfiles.json();
        
        if (profiles && profiles.length > 0) {
          const existingProfile = profiles[0];
          
          // Update existing profile
          const updatedProfile: Partial<UserProfileDTO> = {
            firstName,
            lastName,
            email,
            displayName: displayName || `${firstName} ${lastName}`,
          };

          await fetch(`${process.env.NEXT_PUBLIC_SPRING_API_URL}/api/user-profiles/${existingProfile.id}`, {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${await getAccessToken()}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(updatedProfile),
          });
        } else {
          // Create new profile if none exists
          const newProfile: Partial<UserProfileDTO> = {
            keycloakId: userId,
            firstName,
            lastName,
            email,
            displayName: displayName || `${firstName} ${lastName}`,
            status: 'ACTIVE',
          };

          await fetch(`${process.env.NEXT_PUBLIC_SPRING_API_URL}/api/user-profiles`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${await getAccessToken()}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(newProfile),
          });
        }
      }
    } catch (springError) {
      console.warn('Failed to update Spring backend profile, but Keycloak update succeeded:', springError);
      // Don't throw error here as Keycloak update was successful
      // The main user data is in Keycloak
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
 * Update user password in Keycloak
 */
export async function updateUserPassword(request: UpdatePasswordRequest): Promise<void> {
  const { userId, currentPassword, newPassword } = request;
  
  try {
    const realm = keycloakService.getRealm();
    
    // Get current user to verify current password by attempting authentication
    const currentUser = await getAdminRealmsRealmUsersUserId(realm, userId);
    
    if (!currentUser || !currentUser.username) {
      throw new Error('User not found or username not available');
    }

    // Verify current password by attempting to authenticate
    try {
      await verifyCurrentPassword(currentUser.username, currentPassword);
    } catch (authError) {
      throw new Error('Current password is incorrect');
    }

    // Create new password credential
    const passwordCredential: CredentialRepresentation = {
      type: 'password',
      value: newPassword,
      temporary: false, // User doesn't need to change password on next login
    };

    // Update password in Keycloak
    await putAdminRealmsRealmUsersUserIdResetPassword(realm, userId, passwordCredential);

  } catch (error) {
    console.error('Error updating user password:', error);
    throw new Error(
      error instanceof Error 
        ? error.message 
        : 'Failed to update password. Please try again.'
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

/**
 * Get access token for API calls
 */
async function getAccessToken(): Promise<string> {
  try {
    // Try multiple methods to get the access token
    
    // Method 1: Get from session API
    try {
      const response = await fetch('/api/auth/session');
      if (response.ok) {
        const session = await response.json();
        if (session?.access_token) {
          return session.access_token;
        }
      }
    } catch (sessionError) {
      console.warn('Failed to get token from session API:', sessionError);
    }
    
    // Method 2: Get from local/session storage
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (token) return token;
    }
    
    // Method 3: Import and use auth utility (server-side compatible)
    try {
      const { fetchAccessToken } = await import('@/core/auth/utils');
      const token = await fetchAccessToken();
      if (token) return token;
    } catch (authError) {
      console.warn('Failed to get token from auth utils:', authError);
    }
    
    throw new Error('No access token available');
  } catch (error) {
    console.error('Error getting access token:', error);
    throw new Error('Authentication required. Please sign in again.');
  }
}

/**
 * Get current user profile from Spring backend
 */
export async function getCurrentUserProfile(keycloakId: string): Promise<UserProfileDTO | null> {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SPRING_API_URL}/api/user-profiles/search?keycloakId=${keycloakId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${await getAccessToken()}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.ok) {
      const profiles = await response.json();
      return profiles && profiles.length > 0 ? profiles[0] : null;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting current user profile:', error);
    return null;
  }
}

/**
 * Get current user from Keycloak
 */
export async function getCurrentKeycloakUser(userId: string): Promise<UserRepresentation | null> {
  try {
    const realm = keycloakService.getRealm();
    return await getAdminRealmsRealmUsersUserId(realm, userId);
  } catch (error) {
    console.error('Error getting current Keycloak user:', error);
    return null;
  }
}