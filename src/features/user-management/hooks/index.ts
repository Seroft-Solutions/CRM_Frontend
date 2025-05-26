/**
 * User Management Hooks
 * Custom hooks for user management functionality with state management
 */

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userManagementService } from '../services/user-management.service';
import type {
  OrganizationUser,
  UserInvitation,
  RoleAssignment,
  GroupAssignment,
  UserFilters,
  UserListResponse,
  UserDetailData,
  LoadingStates,
} from '../types';
import type { RoleRepresentation, GroupRepresentation } from '@/core/api/generated/keycloak';
import { toast } from 'sonner';

// Query Keys
export const USER_MANAGEMENT_QUERY_KEYS = {
  organizationUsers: (orgId: string, filters?: UserFilters) => 
    ['organizationUsers', orgId, filters],
  userDetails: (orgId: string, userId: string) => 
    ['userDetails', orgId, userId],
  availableRoles: ['availableRoles'],
  availableGroups: ['availableGroups'],
  userAvailableRoles: (userId: string) => ['userAvailableRoles', userId],
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
    staleTime: 5 * 60 * 1000, // 5 minutes
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

// Hook for user invitation
export function useInviteUser() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (invitation: UserInvitation) => 
      userManagementService.inviteUser(invitation),
    onSuccess: (_, variables) => {
      toast.success('User invited successfully');
      // Invalidate and refetch organization users
      queryClient.invalidateQueries({
        queryKey: USER_MANAGEMENT_QUERY_KEYS.organizationUsers(variables.organizationId),
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
    mutationFn: (assignment: RoleAssignment) =>
      userManagementService.assignRealmRoles(assignment),
    onSuccess: (_, variables) => {
      const action = variables.action === 'assign' ? 'assigned' : 'unassigned';
      toast.success(`Roles ${action} successfully`);
      
      // Invalidate user details and organization users
      queryClient.invalidateQueries({
        queryKey: USER_MANAGEMENT_QUERY_KEYS.userDetails(variables.organizationId, variables.userId),
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
    mutationFn: (assignment: GroupAssignment) =>
      userManagementService.assignGroups(assignment),
    onSuccess: (_, variables) => {
      const action = variables.action === 'assign' ? 'assigned' : 'unassigned';
      toast.success(`Groups ${action} successfully`);
      
      // Invalidate user details and organization users
      queryClient.invalidateQueries({
        queryKey: USER_MANAGEMENT_QUERY_KEYS.userDetails(variables.organizationId, variables.userId),
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

// Hook for organization context (this would be customized based on your auth system)
export function useOrganizationContext() {
  const [organizationId, setOrganizationId] = useState<string>('');
  const [organizationName, setOrganizationName] = useState<string>('');

  useEffect(() => {
    // Get organization context from your auth system
    // This should come from session, JWT token, or API call
    // For now, using a more realistic approach
    const getOrganizationContext = async () => {
      try {
        // In a real app, you'd get this from your session provider
        // For now, we'll use a placeholder that won't cause issues
        setOrganizationId('org-placeholder');
        setOrganizationName('Your Organization');
        
        // TODO: Replace with actual implementation:
        // const { session } = useAuth();
        // if (session?.user?.organizations?.length > 0) {
        //   setOrganizationId(session.user.organizations[0].id);
        //   setOrganizationName(session.user.organizations[0].name);
        // }
      } catch (error) {
        console.error('Failed to get organization context:', error);
        // Set fallback values
        setOrganizationId('default-org');
        setOrganizationName('Default Organization');
      }
    };

    getOrganizationContext();
  }, []);

  return {
    organizationId,
    organizationName,
    setOrganizationId,
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
    setSelectedUsers(prev => [...prev, userId]);
  }, []);

  const unselectUser = useCallback((userId: string) => {
    setSelectedUsers(prev => prev.filter(id => id !== userId));
  }, []);

  const selectAllUsers = useCallback((userIds: string[]) => {
    setSelectedUsers(userIds);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedUsers([]);
  }, []);

  const toggleUserSelection = useCallback((userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
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
