/**
 * User Management Hooks
 * Custom hooks for user management functionality with state management
 */

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userManagementService } from '../services/user-management.service';
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

// Query Keys
export const USER_MANAGEMENT_QUERY_KEYS = {
  organizationUsers: (orgId: string, filters?: UserFilters) => 
    ['organizationUsers', orgId, filters],
  userDetails: (orgId: string, userId: string) => 
    ['userDetails', orgId, userId],
  availableRoles: ['availableRoles'],
  availableGroups: ['availableGroups'],
  userAvailableRoles: (userId: string) => ['userAvailableRoles', userId],
  pendingInvitations: (orgId: string, filters?: InvitationFilters) =>
    ['pendingInvitations', orgId, filters],
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
        toast.success(result.message);
        // Invalidate both users and invitations
        queryClient.invalidateQueries({
          queryKey: USER_MANAGEMENT_QUERY_KEYS.organizationUsers(variables.organizationId),
        });
        queryClient.invalidateQueries({
          queryKey: USER_MANAGEMENT_QUERY_KEYS.pendingInvitations(variables.organizationId),
        });
      } else {
        toast.error(result.message);
      }
    },
    onError: (error: Error) => {
      toast.error(`Failed to invite user: ${error.message}`);
    },
  });

  return {
    inviteUserWithGroups: mutation.mutate,
    isInviting: mutation.isPending,
    error: mutation.error,
  };
}

// Hook for user invitation (enhanced backward compatibility)
export function useInviteUser() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (invitation: UserInvitation) => 
      userManagementService.inviteUser(invitation),
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

// Hook for organization context - Gets organization from NextAuth session
export function useOrganizationContext() {
  const { data: session, status } = useSession();
  const [organizationId, setOrganizationId] = useState<string>('');
  const [organizationName, setOrganizationName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') {
      setIsLoading(true);
      return;
    }

    if (status === 'unauthenticated' || !session) {
      setOrganizationId('');
      setOrganizationName('');
      setIsLoading(false);
      return;
    }

    // Get organization from NextAuth session
    if (session.user?.organizations && session.user.organizations.length > 0) {
      const primaryOrg = session.user.organizations[0]; // Use first organization as primary
      setOrganizationId(primaryOrg.id);
      setOrganizationName(primaryOrg.name);
      
      console.log('Organization context loaded:', {
        id: primaryOrg.id,
        name: primaryOrg.name,
        totalOrgs: session.user.organizations.length
      });
    } else {
      // User has no organizations - this might be an admin user
      console.warn('User has no organizations in session, using fallback');
      setOrganizationId('');
      setOrganizationName('No Organization');
    }

    setIsLoading(false);
  }, [session, status]);

  // Function to switch organization (if user has multiple)
  const switchOrganization = useCallback((orgId: string) => {
    if (session?.user?.organizations) {
      const org = session.user.organizations.find(o => o.id === orgId);
      if (org) {
        setOrganizationId(org.id);
        setOrganizationName(org.name);
      }
    }
  }, [session]);

  return {
    organizationId,
    organizationName,
    isLoading,
    availableOrganizations: session?.user?.organizations || [],
    hasMultipleOrganizations: (session?.user?.organizations?.length || 0) > 1,
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
    mutationFn: ({ userId, groupIds, action }: { 
      userId: string; 
      groupIds: string[]; 
      action: 'assign' | 'unassign' 
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
