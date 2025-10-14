/**
 * User Management Refresh Utilities
 * Utilities to handle data refresh across user management components
 */

import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { USER_MANAGEMENT_QUERY_KEYS } from '@/features/user-management/hooks/index';

export function useUserManagementRefresh() {
  const queryClient = useQueryClient();

  const refreshOrganizationUsers = useCallback(
    async (organizationId: string) => {
      // Invalidate all organization users queries for this org
      await queryClient.invalidateQueries({
        queryKey: ['organizationUsers', organizationId],
        exact: false,
      });

      // Force immediate refetch
      await queryClient.refetchQueries({
        queryKey: ['organizationUsers', organizationId],
        exact: false,
      });

      // Also refresh pending invitations
      await queryClient.invalidateQueries({
        queryKey: ['pendingInvitations', organizationId],
        exact: false,
      });
    },
    [queryClient]
  );

  const refreshUserDetails = useCallback(
    async (organizationId: string, userId: string) => {
      await queryClient.invalidateQueries({
        queryKey: ['userDetails', organizationId, userId],
        exact: false,
      });

      await queryClient.refetchQueries({
        queryKey: ['userDetails', organizationId, userId],
        exact: false,
      });
    },
    [queryClient]
  );

  const refreshAllUserData = useCallback(
    async (organizationId: string) => {
      // Clear all caches first
      await queryClient.invalidateQueries({
        queryKey: ['organizationUsers'],
        exact: false,
      });

      await queryClient.invalidateQueries({
        queryKey: ['pendingInvitations'],
        exact: false,
      });

      await queryClient.invalidateQueries({
        queryKey: ['userDetails'],
        exact: false,
      });

      // Force refetch of organization users
      setTimeout(async () => {
        await queryClient.refetchQueries({
          queryKey: ['organizationUsers', organizationId],
          exact: false,
        });
      }, 100);
    },
    [queryClient]
  );

  return {
    refreshOrganizationUsers,
    refreshUserDetails,
    refreshAllUserData,
  };
}
