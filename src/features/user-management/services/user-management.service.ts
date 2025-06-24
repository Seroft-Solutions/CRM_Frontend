/**
 * Updated User Management Service
 * Uses the unified Keycloak admin service with generated endpoints for type safety
 */

import type {
  OrganizationUser,
  UserInvitation,
  UserInvitationWithGroups,
  PendingInvitation,
  InvitationListResponse,
  InvitationFilters,
  InvitationActionResult,
  RoleAssignment,
  GroupAssignment,
  UserFilters,
  UserListResponse,
  UserDetailData,
} from '../types';

import type {
  RoleRepresentation,
  GroupRepresentation,
  MemberRepresentation,
  UserRepresentation,
} from '@/core/api/generated/keycloak';

/**
 * Unified User Management Service
 *
 * This service provides a high-level API for user management operations
 * while leveraging the unified Keycloak admin client and generated endpoints
 * for type safety and consistency.
 */
export class UserManagementService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = '/api/keycloak';
  }

  // Organization Users Management
  async getOrganizationUsers(
    organizationId: string,
    filters?: UserFilters
  ): Promise<UserListResponse> {
    try {
      const params = new URLSearchParams();

      if (filters?.search) params.append('search', filters.search);
      if (filters?.page) params.append('first', String((filters.page - 1) * (filters.size || 20)));
      if (filters?.size) params.append('max', String(filters.size));

      // Add status filters
      if (filters?.enabled !== undefined) params.append('enabled', String(filters.enabled));
      if (filters?.emailVerified !== undefined)
        params.append('emailVerified', String(filters.emailVerified));

      const response = await fetch(
        `${this.baseUrl}/organizations/${organizationId}/members?${params.toString()}`
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch organization users');
      }

      const members: MemberRepresentation[] = await response.json();

      // Transform MemberRepresentation to OrganizationUser
      let users: OrganizationUser[] = members.map((member) => ({
        id: member.id,
        username: member.username,
        email: member.email,
        firstName: member.firstName,
        lastName: member.lastName,
        enabled: member.enabled,
        emailVerified: member.emailVerified,
        createdTimestamp: member.createdTimestamp,
        organizationId,
        assignedRoles: [], // Will be populated when fetching details
        assignedGroups: [], // Will be populated when fetching details
        attributes: member.attributes,
        access: member.access,
        // Map member-specific fields
        membershipType: member.membershipType,
        roles: member.roles,
        applicationRoles: member.applicationRoles,
        clientRoles: member.clientRoles,
      }));

      // Apply client-side filtering if backend doesn't support it
      if (filters?.search) {
        const searchTerm = filters.search.toLowerCase();
        users = users.filter(
          (user) =>
            user.firstName?.toLowerCase().includes(searchTerm) ||
            user.lastName?.toLowerCase().includes(searchTerm) ||
            user.email?.toLowerCase().includes(searchTerm) ||
            user.username?.toLowerCase().includes(searchTerm)
        );
      }

      if (filters?.enabled !== undefined) {
        users = users.filter((user) => user.enabled === filters.enabled);
      }

      if (filters?.emailVerified !== undefined) {
        users = users.filter((user) => user.emailVerified === filters.emailVerified);
      }

      // Calculate pagination
      const totalCount = users.length;
      const pageSize = filters?.size || 20;
      const currentPage = filters?.page || 1;
      const totalPages = Math.ceil(totalCount / pageSize);

      // Apply pagination
      const startIndex = (currentPage - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedUsers = users.slice(startIndex, endIndex);

      return {
        users: paginatedUsers,
        totalCount,
        currentPage,
        totalPages,
      };
    } catch (error) {
      console.error('Failed to fetch organization users:', error);
      throw new Error(
        'Failed to fetch organization users. Please check your permissions and try again.'
      );
    }
  }

  async getUserDetails(organizationId: string, userId: string): Promise<UserDetailData> {
    try {
      // Get user details from our API route (which uses generated endpoints)
      const response = await fetch(`${this.baseUrl}/users/${userId}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch user details');
      }

      const data = await response.json();

      // Get available roles and groups
      const [availableRoles, availableGroups] = await Promise.all([
        this.getAvailableRealmRoles(),
        this.getAvailableGroups(),
      ]);

      // Transform UserRepresentation to OrganizationUser
      const organizationUser: OrganizationUser = {
        ...data.user,
        organizationId,
        assignedRoles: data.assignedRealmRoles || [],
        assignedGroups: data.assignedGroups || [],
      };

      return {
        user: organizationUser,
        assignedRealmRoles: data.assignedRealmRoles || [],
        assignedClientRoles: {},
        assignedGroups: data.assignedGroups || [],
        availableRealmRoles: availableRoles,
        availableClientRoles: {},
        availableGroups: availableGroups,
      };
    } catch (error) {
      console.error('Failed to fetch user details:', error);
      throw new Error('Failed to fetch user details');
    }
  }

  // ENHANCED: User Invitation with Groups
  async inviteUserWithGroups(
    invitation: UserInvitationWithGroups
  ): Promise<InvitationActionResult> {
    try {
      const response = await fetch(
        `${this.baseUrl}/organizations/${invitation.organizationId}/members`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: invitation.email,
            firstName: invitation.firstName,
            lastName: invitation.lastName,
            selectedGroups: invitation.selectedGroups,
            selectedRoles: invitation.selectedRoles,
            invitationNote: invitation.invitationNote,
            sendWelcomeEmail: invitation.sendWelcomeEmail,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to invite user');
      }

      const result = await response.json();
      return {
        success: true,
        message: 'User invited successfully with group assignments',
        invitationId: result.invitationId,
      };
    } catch (error) {
      console.error('Failed to invite user with groups:', error);
      return {
        success: false,
        message: 'Failed to invite user',
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  // ENHANCED: Get Pending Invitations
  async getPendingInvitations(
    organizationId: string,
    filters?: InvitationFilters
  ): Promise<InvitationListResponse> {
    try {
      const params = new URLSearchParams();

      if (filters?.status) params.append('status', filters.status.join(','));
      if (filters?.search) params.append('search', filters.search);
      if (filters?.page) params.append('page', String(filters.page));
      if (filters?.size) params.append('size', String(filters.size));

      const response = await fetch(
        `${this.baseUrl}/organizations/${organizationId}/invitations?${params.toString()}`
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch pending invitations');
      }

      return response.json();
    } catch (error) {
      console.error('Failed to fetch pending invitations:', error);
      throw new Error('Failed to fetch pending invitations');
    }
  }

  // ENHANCED: Assign Groups from Invitation
  async assignGroupsFromInvitation(
    organizationId: string,
    userId: string
  ): Promise<InvitationActionResult> {
    try {
      const response = await fetch(`${this.baseUrl}/organizations/${organizationId}/invitations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          action: 'assign-groups',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to assign groups from invitation');
      }

      const result = await response.json();
      return {
        success: true,
        message: result.message,
      };
    } catch (error) {
      console.error('Failed to assign groups from invitation:', error);
      return {
        success: false,
        message: 'Failed to assign groups from invitation',
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  // User Invitation (backward compatibility)
  async inviteUser(invitation: UserInvitation): Promise<void> {
    try {
      const response = await fetch(
        `${this.baseUrl}/organizations/${invitation.organizationId}/members`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: invitation.email,
            firstName: invitation.firstName,
            lastName: invitation.lastName,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to invite user');
      }
    } catch (error) {
      console.error('Failed to invite user:', error);
      throw new Error('Failed to invite user');
    }
  }

  // Role Management
  async assignRealmRoles(assignment: RoleAssignment): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/users/${assignment.userId}/roles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roles: assignment.roles,
          action: assignment.action,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to assign/unassign roles');
      }
    } catch (error) {
      console.error('Failed to assign/unassign realm roles:', error);
      throw new Error('Failed to assign/unassign realm roles');
    }
  }

  // Group Management
  async assignGroups(assignment: GroupAssignment): Promise<void> {
    try {
      // Extract group IDs from GroupRepresentation objects
      const groupIds = assignment.groups.map((group) => group.id).filter(Boolean) as string[];

      const response = await fetch(`${this.baseUrl}/users/${assignment.userId}/groups`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: assignment.action,
          groupIds: groupIds,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to assign/unassign groups');
      }
    } catch (error) {
      console.error('Failed to assign/unassign groups:', error);
      throw new Error('Failed to assign/unassign groups');
    }
  }

  // Available Options with Type Safety
  async getAvailableRealmRoles(): Promise<RoleRepresentation[]> {
    try {
      const response = await fetch(`${this.baseUrl}/roles`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch available roles');
      }

      const roles: RoleRepresentation[] = await response.json();
      return roles;
    } catch (error) {
      console.error('Failed to fetch available realm roles:', error);
      throw new Error('Failed to fetch available realm roles');
    }
  }

  async getAvailableGroups(): Promise<GroupRepresentation[]> {
    try {
      const response = await fetch(`${this.baseUrl}/groups`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch available groups');
      }

      const groups: GroupRepresentation[] = await response.json();
      return groups;
    } catch (error) {
      console.error('Failed to fetch available groups:', error);
      throw new Error('Failed to fetch available groups');
    }
  }

  // Enhanced methods with better error handling and type safety
  async updateUser(userId: string, userData: Partial<UserRepresentation>): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update user');
      }
    } catch (error) {
      console.error('Failed to update user:', error);
      throw new Error('Failed to update user');
    }
  }

  async deleteUser(userId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/users/${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete user');
      }
    } catch (error) {
      console.error('Failed to delete user:', error);
      throw new Error('Failed to delete user');
    }
  }

  // ENHANCED: User-Group Assignment
  async getUserGroups(userId: string): Promise<{
    user: UserRepresentation;
    assignedGroups: GroupRepresentation[];
    availableGroups: GroupRepresentation[];
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/users/${userId}/groups`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch user groups');
      }

      return response.json();
    } catch (error) {
      console.error('Failed to fetch user groups:', error);
      throw new Error('Failed to fetch user groups');
    }
  }

  async assignUserGroups(
    userId: string,
    groupIds: string[],
    action: 'assign' | 'unassign'
  ): Promise<InvitationActionResult> {
    try {
      const response = await fetch(`${this.baseUrl}/users/${userId}/groups`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          groupIds,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Failed to ${action} user groups`);
      }

      const result = await response.json();
      return {
        success: result.success,
        message: result.message,
      };
    } catch (error) {
      console.error(`Failed to ${action} user groups:`, error);
      return {
        success: false,
        message: `Failed to ${action} user groups`,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  // Enhanced method for invitation follow-up
  async assignGroupsToInvitedUser(
    organizationId: string,
    userId: string
  ): Promise<InvitationActionResult> {
    return this.assignGroupsFromInvitation(organizationId, userId);
  }

  async removeUserFromOrganization(organizationId: string, userId: string): Promise<void> {
    try {
      const response = await fetch(
        `${this.baseUrl}/organizations/${organizationId}/members/${userId}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to remove user from organization');
      }
    } catch (error) {
      console.error('Failed to remove user from organization:', error);
      throw new Error('Failed to remove user from organization');
    }
  }

  async assignClientRoles(
    userId: string,
    clientId: string,
    roles: RoleRepresentation[],
    action: 'assign' | 'unassign'
  ): Promise<void> {
    // TODO: Implement when client role endpoints are added to API routes
    throw new Error('Client role assignment not implemented yet');
  }

  async getUserAvailableRealmRoles(userId: string): Promise<RoleRepresentation[]> {
    // TODO: Implement to get roles not assigned to user
    // For now, return all roles minus assigned ones
    return this.getAvailableRealmRoles();
  }

  async getUserAvailableClientRoles(
    userId: string,
    clientId: string
  ): Promise<RoleRepresentation[]> {
    // TODO: Implement when client role endpoints are available
    return [];
  }
}

// Default service instance
export const userManagementService = new UserManagementService();
