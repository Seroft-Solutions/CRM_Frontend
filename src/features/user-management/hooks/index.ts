/**
 * User Management Hooks
 * Custom hooks for user management functionality with state management
 */

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUserOrganizations } from '@/hooks/useUserOrganizations';
import { userManagementService } from '@/features/user-management/services/user-management.service';
import type {
  OrganizationUser,
  UserInvitation,
  UserInvitationWithGroups,
  PendingInvitation,
  InvitationListResponse,
  InvitationFilters,
  RoleAssignment,
  GroupAssignment,
  UserFilters,
  UserListResponse,
  UserDetailData,
  LoadingStates,
} from '../types';
import type { RoleRepresentation, GroupRepresentation } from '@/core/api/generated/keycloak';
import { toast } from 'sonner';

// Export additional hooks
export { useUserRoleGroupCounts, useBatchUserRoleGroupCounts } from './useUserRoleGroupCounts';
export { useUserManagementRefresh } from './useUserManagementRefresh';

// Query Keys
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

// Hook for organization users list
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
    staleTime: 0, // Always consider data stale so it refetches readily
    cacheTime: 30 * 1000, // Keep cache for 30 seconds
    refetchOnWindowFocus: true, // Refetch when window regains focus
    refetchOnMount: true, // Always refetch on mount
    refetchInterval: false, // Don't auto-refresh continuously
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

// Hook for user details
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
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  return {
    userDetails,
    isLoading,
    error,
    refetch,
  };
}

// Hook for available realm roles
export function useAvailableRoles() {
  const {
    data: roles,
    isLoading,
    error,
  } = useQuery({
    queryKey: USER_MANAGEMENT_QUERY_KEYS.availableRoles,
    queryFn: () => userManagementService.getAvailableRealmRoles(),
    staleTime: 10 * 60 * 1000, // 10 minutes - roles don't change often
  });

  return {
    roles: roles || [],
    isLoading,
    error,
  };
}

// Hook for available groups
export function useAvailableGroups() {
  const {
    data: groups,
    isLoading,
    error,
  } = useQuery({
    queryKey: USER_MANAGEMENT_QUERY_KEYS.availableGroups,
    queryFn: () => userManagementService.getAvailableGroups(),
    staleTime: 10 * 60 * 1000, // 10 minutes - groups don't change often
  });

  return {
    groups: groups || [],
    isLoading,
    error,
  };
}

// ENHANCED: Hook for pending invitations
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
    staleTime: 2 * 60 * 1000, // 2 minutes
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

// ENHANCED: Hook for user invitation with groups
export function useInviteUserWithGroups() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (invitation: UserInvitationWithGroups) =>
      userManagementService.inviteUserWithGroups(invitation),
    onSuccess: (result, variables) => {
      if (result.success) {
        toast.success(result.message || 'User invited successfully');

        // Multiple-step aggressive refresh strategy
        const performRefresh = async () => {
          // Step 1: Immediate invalidation
          await queryClient.invalidateQueries({
            queryKey: ['organizationUsers', variables.organizationId],
            exact: false,
          });

          await queryClient.invalidateQueries({
            queryKey: ['pendingInvitations', variables.organizationId],
            exact: false,
          });

          // Step 2: Small delay then force refetch
          setTimeout(async () => {
            await queryClient.refetchQueries({
              queryKey: ['organizationUsers', variables.organizationId],
              exact: false,
            });
          }, 200);

          // Step 3: Another refetch after a longer delay to catch backend processing
          setTimeout(async () => {
            await queryClient.refetchQueries({
              queryKey: ['organizationUsers', variables.organizationId],
              exact: false,
            });
          }, 1000);

          // Step 4: Final refetch after 2 seconds
          setTimeout(async () => {
            await queryClient.refetchQueries({
              queryKey: ['organizationUsers', variables.organizationId],
              exact: false,
            });
          }, 2000);
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

// Hook for user invitation (enhanced backward compatibility)
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

// Hook for removing user from organization
export function useRemoveUser() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({ organizationId, userId }: { organizationId: string; userId: string }) =>
      userManagementService.removeUserFromOrganization(organizationId, userId),
    onSuccess: (_, variables) => {
      toast.success('User removed from organization successfully');
      // Invalidate and refetch organization users
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

// Hook for role assignment
export function useRoleAssignment() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (assignment: RoleAssignment) => userManagementService.assignRealmRoles(assignment),
    onSuccess: (_, variables) => {
      const action = variables.action === 'assign' ? 'assigned' : 'unassigned';
      toast.success(`Roles ${action} successfully`);

      // Invalidate user details and organization users
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

// Hook for group assignment
export function useGroupAssignment() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (assignment: GroupAssignment) => userManagementService.assignGroups(assignment),
    onSuccess: (_, variables) => {
      const action = variables.action === 'assign' ? 'assigned' : 'unassigned';
      toast.success(`Groups ${action} successfully`);

      // Invalidate user details and organization users
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

// Hook for organization context - Gets organization from API
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

    // Get organization from API data
    if (organizations && organizations.length > 0) {
      const primaryOrg = organizations[0]; // Use first organization as primary
      setOrganizationId(primaryOrg.id);
      setOrganizationName(primaryOrg.name);

      console.log('Organization context loaded:', {
        id: primaryOrg.id,
        name: primaryOrg.name,
        totalOrgs: organizations.length,
      });
    } else {
      // User has no organizations
      console.warn('User has no organizations, using fallback');
      setOrganizationId('');
      setOrganizationName('No Organization');
    }

    setIsLoading(false);
  }, [session, status, organizations, orgLoading]);

  // Function to switch organization (if user has multiple)
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
    setOrganizationId, // Keep for backward compatibility
  };
}

// ENHANCED: Hook for user groups management
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

// ENHANCED: Hook for assigning user groups
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

// Custom hook for bulk operations
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
