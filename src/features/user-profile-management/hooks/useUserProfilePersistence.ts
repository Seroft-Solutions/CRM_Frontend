/**
 * User Profile Persistence Hook
 */
import { useState } from 'react';
import { toast } from 'sonner';
import { useCreateUserProfile } from '@/core/api/generated/spring/endpoints/user-profile-resource/user-profile-resource.gen';
import type { UserProfileDTO } from '@/core/api/generated/spring/schemas';

export function useUserProfilePersistence() {
  const [isCreating, setIsCreating] = useState(false);
  const createProfileMutation = useCreateUserProfile();

  const createProfileForPartner = async (
    keycloakId: string,
    email: string,
    firstName?: string,
    lastName?: string,
    channelTypeId?: number
  ) => {
    if (!keycloakId) return null;

    setIsCreating(true);
    try {
      const profileData: UserProfileDTO = {
        keycloakId,
        email,
        firstName,
        lastName,
        ...(channelTypeId && { channelType: { id: channelTypeId } }),
      };

      const newProfile = await createProfileMutation.mutateAsync({
        data: profileData,
      });

      toast.success('User profile created successfully');
      return newProfile;
    } catch (error) {
      console.error('Failed to create user profile:', error);
      toast.error('Failed to create user profile');
      return null;
    } finally {
      setIsCreating(false);
    }
  };

  return {
    createProfileForPartner,
    isCreating: isCreating || createProfileMutation.isPending,
  };
}
