/**
 * Hook for fetching user role and group counts
 * This hook provides a way to fetch detailed role/group information for users
 * when the organization users list doesn't include this data
 */

import { useQuery } from '@tanstack/react-query';
import { userManagementService } from '@/features/user-management/services/user-management.service';
import type { RoleRepresentation, GroupRepresentation } from '@/core/api/generated/keycloak';

interface UserRoleGroupCounts {
  userId: string;
  roleCount: number;
  groupCount: number;
  roles: RoleRepresentation[];
  groups: GroupRepresentation[];
  hasData: boolean;
}

export function useUserRoleGroupCounts(organizationId: string, userId: string, enabled = true) {
  const {
    data: userDetails,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['userRoleGroupCounts', organizationId, userId],
    queryFn: () => userManagementService.getUserDetails(organizationId, userId),
    enabled: !!organizationId && !!userId && enabled,
    staleTime: 5 * 60 * 1000,

    retry: 1,
  });

  const result: UserRoleGroupCounts = {
    userId,
    roleCount: userDetails?.assignedRealmRoles?.length || 0,
    groupCount: userDetails?.assignedGroups?.length || 0,
    roles: userDetails?.assignedRealmRoles || [],
    groups: userDetails?.assignedGroups || [],
    hasData: !!userDetails,
  };

  return {
    ...result,
    isLoading,
    error,
  };
}

export function useBatchUserRoleGroupCounts(
  organizationId: string,
  userIds: string[],
  enabled = true
) {
  const queries = userIds.map((userId) => ({
    queryKey: ['userRoleGroupCounts', organizationId, userId],
    queryFn: () => userManagementService.getUserDetails(organizationId, userId),
    enabled: !!organizationId && !!userId && enabled,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  }));

  const results = userIds.map((userId) => useUserRoleGroupCounts(organizationId, userId, enabled));

  const isLoading = results.some((result) => result.isLoading);
  const hasErrors = results.some((result) => result.error);

  const userCounts = results.reduce(
    (acc, result) => {
      acc[result.userId] = {
        roleCount: result.roleCount,
        groupCount: result.groupCount,
        roles: result.roles,
        groups: result.groups,
        hasData: result.hasData,
      };
      return acc;
    },
    {} as Record<string, Omit<UserRoleGroupCounts, 'userId'>>
  );

  return {
    userCounts,
    isLoading,
    hasErrors,
  };
}
