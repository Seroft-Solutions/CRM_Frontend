/**
 * User Profile Update Hook
 * Custom hook for managing user profile updates with state management
 */

import { useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import {
  updateUserBasicInfo,
  updateUserPassword,
  getUserProfileData,
  type UpdateBasicInfoRequest,
  type UpdatePasswordRequest,
  type UserProfileData,
} from '../services/user-profile-update.service';
import type { UserProfileDTO } from '@/core/api/generated/spring/schemas';
import type { UserRepresentation } from '@/core/api/generated/keycloak/schemas';

interface UseUserProfileUpdateState {
  isUpdatingBasicInfo: boolean;
  isUpdatingPassword: boolean;
  isLoadingProfile: boolean;
  profile: UserProfileDTO | null;
  keycloakUser: UserRepresentation | null;
  error: string | null;
}

interface UseUserProfileUpdateActions {
  updateBasicInfo: (data: UpdateBasicInfoRequest) => Promise<boolean>;
  updatePassword: (data: UpdatePasswordRequest) => Promise<boolean>;
  refreshProfile: () => Promise<void>;
  clearError: () => void;
}

export type UseUserProfileUpdateReturn = UseUserProfileUpdateState & UseUserProfileUpdateActions;

/**
 * Hook for managing user profile updates
 */
export function useUserProfileUpdate(): UseUserProfileUpdateReturn {
  const { data: session, update: updateSession } = useSession();
  const [state, setState] = useState<UseUserProfileUpdateState>({
    isUpdatingBasicInfo: false,
    isUpdatingPassword: false,
    isLoadingProfile: false,
    profile: null,
    keycloakUser: null,
    error: null,
  });

  const setError = useCallback((error: string | null) => {
    setState((prev) => ({ ...prev, error }));
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, [setError]);

  const refreshProfile = useCallback(async () => {
    if (!session?.user?.id) {
      setError('User session not found');
      return;
    }

    setState((prev) => ({ ...prev, isLoadingProfile: true, error: null }));

    try {
      const profileData = await getUserProfileData();

      if (profileData) {
        setState((prev) => ({
          ...prev,
          profile: profileData.springProfile,
          keycloakUser: profileData.keycloakUser,
          isLoadingProfile: false,
        }));
      } else {
        setError('Failed to load profile information');
        setState((prev) => ({ ...prev, isLoadingProfile: false }));
      }
    } catch (error) {
      console.error('Error refreshing profile:', error);
      setError('Failed to load profile information');
      setState((prev) => ({ ...prev, isLoadingProfile: false }));
    }
  }, [session?.user?.id, setError]);

  const updateBasicInfo = useCallback(
    async (data: UpdateBasicInfoRequest): Promise<boolean> => {
      if (!session?.user?.id) {
        setError('User session not found');
        return false;
      }

      setState((prev) => ({ ...prev, isUpdatingBasicInfo: true, error: null }));

      try {
        await updateUserBasicInfo(data);

        // Refresh the session to reflect updated user information
        await updateSession();

        // Refresh profile data
        await refreshProfile();

        toast.success('Profile updated successfully');
        setState((prev) => ({ ...prev, isUpdatingBasicInfo: false }));
        return true;
      } catch (error) {
        console.error('Error updating basic info:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to update profile';
        setError(errorMessage);
        toast.error(errorMessage);
        setState((prev) => ({ ...prev, isUpdatingBasicInfo: false }));
        return false;
      }
    },
    [session?.user?.id, updateSession, refreshProfile, setError]
  );

  const updatePassword = useCallback(
    async (data: UpdatePasswordRequest): Promise<boolean> => {
      if (!session?.user?.id) {
        setError('User session not found');
        return false;
      }

      setState((prev) => ({ ...prev, isUpdatingPassword: true, error: null }));

      try {
        await updateUserPassword(data);

        toast.success('Password updated successfully');
        setState((prev) => ({ ...prev, isUpdatingPassword: false }));
        return true;
      } catch (error) {
        console.error('Error updating password:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to update password';
        setError(errorMessage);
        toast.error(errorMessage);
        setState((prev) => ({ ...prev, isUpdatingPassword: false }));
        return false;
      }
    },
    [session?.user?.id, setError]
  );

  return {
    ...state,
    updateBasicInfo,
    updatePassword,
    refreshProfile,
    clearError,
  };
}
