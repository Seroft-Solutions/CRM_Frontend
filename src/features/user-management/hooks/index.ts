/**
 * User Management Hooks
 * Custom hooks for user management functionality with state management
 */

import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useUserOrganizations } from '@/hooks/useUserOrganizations';
import { userManagementService } from '@/features/user-management/services/user-management.service';
import type {
  GroupAssignment,
  InvitationFilters,
  LoadingStates,
  RoleAssignment,
  UserFilters,
  UserInvitation,
  UserInvitationWithGroups,
} from '../types';
import { toast } from 'sonner';

export { useUserRoleGroupCounts, useBatchUserRoleGroupCounts } from './useUserRoleGroupCounts';
export { useUserManagementRefresh } from './useUserManagementRefresh';

export const USER_MANAGEMENT_QUERY_KEYS = {
  organizationUsers: (orgId: string, filters?: UserFilters) => [
    'organizationUsers',
    orgId,
    filters,
  ],
  userDetails: (orgId: string, userId: string) => ['userDetails', orgId, userId],
  availableRoles: ['availableRoles'],
  availableGroups: ['availableGroups'],
  userAvailableRoles: (userId: string) => ['userAvailableRoles', userId],
  pendingInvitations: (orgId: string, filters?: InvitationFilters) => [
    'pendingInvitations',
    orgId,
    filters,
  ],
} as const;

export function useOrganizationUsers(organizationId: string, filters?: UserFilters) {
  const {
    data: userListResponse,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: USER_MANAGEMENT_QUERY_KEYS.organizationUsers(organizationId, filters),
    queryFn: () => userManagementService.getOrganizationUsers(organizationId, filters),
    enabled: !!organizationId,
    staleTime: 0,
    cacheTime: 30 * 1000,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchInterval: false,
  });

  return {
    users: userListResponse?.users || [],
    totalCount: userListResponse?.totalCount || 0,
    currentPage: userListResponse?.currentPage || 1,
    totalPages: userListResponse?.totalPages || 1,
    isLoading,
    error,
    refetch,
  };
}

export function useUserDetails(organizationId: string, userId: string) {
  const {
    data: userDetails,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: USER_MANAGEMENT_QUERY_KEYS.userDetails(organizationId, userId),
    queryFn: () => userManagementService.getUserDetails(organizationId, userId),
    enabled: !!organizationId && !!userId,
    staleTime: 2 * 60 * 1000,
  });

  return {
    userDetails,
    isLoading,
    error,
    refetch,
  };
}

export function useAvailableRoles() {
  const {
    data: roles,
    isLoading,
    error,
  } = useQuery({
    queryKey: USER_MANAGEMENT_QUERY_KEYS.availableRoles,
    queryFn: () => userManagementService.getAvailableRealmRoles(),
    staleTime: 10 * 60 * 1000,
  });

  return {
    roles: roles || [],
    isLoading,
    error,
  };
}

export function useAvailableGroups() {
  const {
    data: groups,
    isLoading,
    error,
  } = useQuery({
    queryKey: USER_MANAGEMENT_QUERY_KEYS.availableGroups,
    queryFn: () => userManagementService.getAvailableGroups(),
    staleTime: 10 * 60 * 1000,
  });

  return {
    groups: groups || [],
    isLoading,
    error,
  };
}

export function usePendingInvitations(organizationId: string, filters?: InvitationFilters) {
  const {
    data: invitationResponse,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: USER_MANAGEMENT_QUERY_KEYS.pendingInvitations(organizationId, filters),
    queryFn: () => userManagementService.getPendingInvitations(organizationId, filters),
    enabled: !!organizationId,
    staleTime: 2 * 60 * 1000,
  });

  return {
    invitations: invitationResponse?.invitations || [],
    totalCount: invitationResponse?.totalCount || 0,
    currentPage: invitationResponse?.currentPage || 1,
    totalPages: invitationResponse?.totalPages || 1,
    isLoading,
    error,
    refetch,
  };
}

export function useInviteUserWithGroups() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (invitation: UserInvitationWithGroups) =>
      userManagementService.inviteUserWithGroups(invitation),
    onSuccess: (result, variables) => {
      if (result.success) {
        toast.success(result.message || 'User invited successfully');

        const performRefresh = async () => {
          await Promise.all([
            queryClient.invalidateQueries({
              queryKey: ['organizationUsers', variables.organizationId],
              exact: false,
            }),
            queryClient.invalidateQueries({
              queryKey: ['pendingInvitations', variables.organizationId],
              exact: false,
            }),
          ]);

          setTimeout(async () => {
            await Promise.all([
              queryClient.refetchQueries({
                queryKey: ['organizationUsers', variables.organizationId],
                exact: false,
                type: 'active',
              }),
              queryClient.refetchQueries({
                queryKey: ['pendingInvitations', variables.organizationId],
                exact: false,
                type: 'active',
              }),
            ]);
          }, 500);
        };

        performRefresh();
      } else {
        toast.error(result.message || 'Failed to invite user');
      }
    },
    onError: (error: Error) => {
      toast.error(`Failed to invite user: ${error.message}`);
    },
  });

  return {
    inviteUserWithGroups: mutation.mutate,
    inviteUserWithGroupsAsync: mutation.mutateAsync,
    isInviting: mutation.isPending,
    error: mutation.error,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
  };
}

export function useInviteUser() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (invitation: UserInvitation) => userManagementService.inviteUser(invitation),
    onSuccess: (_, variables) => {
      toast.success('User invited successfully');
      queryClient.invalidateQueries({
        queryKey: USER_MANAGEMENT_QUERY_KEYS.organizationUsers(variables.organizationId),
      });
      queryClient.invalidateQueries({
        queryKey: USER_MANAGEMENT_QUERY_KEYS.pendingInvitations(variables.organizationId),
      });
    },
    onError: (error: Error) => {
      toast.error(`Failed to invite user: ${error.message}`);
    },
  });

  return {
    inviteUser: mutation.mutate,
    isInviting: mutation.isPending,
    error: mutation.error,
  };
}

export function useRemoveUser() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({ organizationId, userId }: { organizationId: string; userId: string }) =>
      userManagementService.removeUserFromOrganization(organizationId, userId),
    onSuccess: (_, variables) => {
      toast.success('User removed from organization successfully');

      queryClient.invalidateQueries({
        queryKey: USER_MANAGEMENT_QUERY_KEYS.organizationUsers(variables.organizationId),
      });
    },
    onError: (error: Error) => {
      toast.error(`Failed to remove user: ${error.message}`);
    },
  });

  return {
    removeUser: mutation.mutate,
    isRemoving: mutation.isPending,
    error: mutation.error,
  };
}

export function useRoleAssignment() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (assignment: RoleAssignment) => userManagementService.assignRealmRoles(assignment),
    onSuccess: (_, variables) => {
      const action = variables.action === 'assign' ? 'assigned' : 'unassigned';
      toast.success(`Roles ${action} successfully`);

      queryClient.invalidateQueries({
        queryKey: USER_MANAGEMENT_QUERY_KEYS.userDetails(
          variables.organizationId,
          variables.userId
        ),
      });
      queryClient.invalidateQueries({
        queryKey: USER_MANAGEMENT_QUERY_KEYS.organizationUsers(variables.organizationId),
      });
    },
    onError: (error: Error) => {
      toast.error(`Failed to assign/unassign roles: ${error.message}`);
    },
  });

  return {
    assignRoles: mutation.mutate,
    isAssigning: mutation.isPending,
    error: mutation.error,
  };
}

export function useGroupAssignment() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (assignment: GroupAssignment) => userManagementService.assignGroups(assignment),
    onSuccess: (_, variables) => {
      const action = variables.action === 'assign' ? 'assigned' : 'unassigned';
      toast.success(`Groups ${action} successfully`);

      queryClient.invalidateQueries({
        queryKey: USER_MANAGEMENT_QUERY_KEYS.userDetails(
          variables.organizationId,
          variables.userId
        ),
      });
      queryClient.invalidateQueries({
        queryKey: USER_MANAGEMENT_QUERY_KEYS.organizationUsers(variables.organizationId),
      });
    },
    onError: (error: Error) => {
      toast.error(`Failed to assign/unassign groups: ${error.message}`);
    },
  });

  return {
    assignGroups: mutation.mutate,
    isAssigning: mutation.isPending,
    error: mutation.error,
  };
}

export function useOrganizationContext() {
  const { data: session, status } = useSession();
  const { data: organizations, isLoading: orgLoading } = useUserOrganizations();
  const [organizationId, setOrganizationId] = useState<string>('');
  const [organizationName, setOrganizationName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading' || orgLoading) {
      setIsLoading(true);
      return;
    }

    if (status === 'unauthenticated' || !session) {
      setOrganizationId('');
      setOrganizationName('');
      setIsLoading(false);
      return;
    }

    if (organizations && organizations.length > 0) {
      const primaryOrg = organizations[0];
      setOrganizationId(primaryOrg.id);
      setOrganizationName(primaryOrg.name);

      console.log('Organization context loaded:', {
        id: primaryOrg.id,
        name: primaryOrg.name,
        totalOrgs: organizations.length,
      });
    } else {
      console.warn('User has no organizations, using fallback');
      setOrganizationId('');
      setOrganizationName('No Organization');
    }

    setIsLoading(false);
  }, [session, status, organizations, orgLoading]);

  const switchOrganization = useCallback(
    (orgId: string) => {
      if (organizations) {
        const org = organizations.find((o) => o.id === orgId);
        if (org) {
          setOrganizationId(org.id);
          setOrganizationName(org.name);
        }
      }
    },
    [organizations]
  );

  return {
    organizationId,
    organizationName,
    isLoading,
    availableOrganizations: organizations || [],
    hasMultipleOrganizations: (organizations?.length || 0) > 1,
    switchOrganization,
    setOrganizationId,
  };
}

export function useUserGroups(userId: string) {
  const {
    data: userGroupsData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['userGroups', userId],
    queryFn: () => userManagementService.getUserGroups(userId),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
  });

  return {
    user: userGroupsData?.user,
    assignedGroups: userGroupsData?.assignedGroups || [],
    availableGroups: userGroupsData?.availableGroups || [],
    isLoading,
    error,
    refetch,
  };
}

export function useAssignUserGroups() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({
      userId,
      groupIds,
      action,
    }: {
      userId: string;
      groupIds: string[];
      action: 'assign' | 'unassign';
    }) => userManagementService.assignUserGroups(userId, groupIds, action),
    onSuccess: (result, variables) => {
      if (result.success) {
        toast.success(result.message);
        queryClient.invalidateQueries({
          queryKey: ['userGroups', variables.userId],
        });
      } else {
        toast.error(result.message);
      }
    },
    onError: (error: Error) => {
      toast.error(`Failed to assign groups: ${error.message}`);
    },
  });

  return {
    assignUserGroups: mutation.mutate,
    isAssigning: mutation.isPending,
    error: mutation.error,
  };
}

export function useBulkUserOperations() {
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [loadingStates, setLoadingStates] = useState<LoadingStates>({
    users: false,
    roles: false,
    groups: false,
    invitation: false,
    assignment: false,
  });

  const selectUser = useCallback((userId: string) => {
    setSelectedUsers((prev) => [...prev, userId]);
  }, []);

  const unselectUser = useCallback((userId: string) => {
    setSelectedUsers((prev) => prev.filter((id) => id !== userId));
  }, []);

  const selectAllUsers = useCallback((userIds: string[]) => {
    setSelectedUsers(userIds);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedUsers([]);
  }, []);

  const toggleUserSelection = useCallback((userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  }, []);

  return {
    selectedUsers,
    loadingStates,
    setLoadingStates,
    selectUser,
    unselectUser,
    selectAllUsers,
    clearSelection,
    toggleUserSelection,
    hasSelectedUsers: selectedUsers.length > 0,
    selectedCount: selectedUsers.length,
  };
}
