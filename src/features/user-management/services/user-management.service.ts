/**
 * Updated User Management Service
 * Uses Next.js API routes to avoid CORS issues with Keycloak Admin API
 */

import type {
  OrganizationUser,
  UserInvitation,
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
} from '@/core/api/generated/keycloak';

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

      const response = await fetch(
        `${this.baseUrl}/organizations/${organizationId}/members?${params.toString()}`
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch organization users');
      }

      const members: MemberRepresentation[] = await response.json();

      const users: OrganizationUser[] = members.map((member) => ({
        ...member,
        organizationId,
      }));

      return {
        users,
        totalCount: users.length,
        currentPage: filters?.page || 1,
        totalPages: Math.ceil(users.length / (filters?.size || 20)),
      };
    } catch (error) {
      console.error('Failed to fetch organization users:', error);
      throw new Error('Failed to fetch organization users. Please check your permissions and try again.');
    }
  }

  async getUserDetails(organizationId: string, userId: string): Promise<UserDetailData> {
    try {
      // Get user details
      const response = await fetch(`${this.baseUrl}/users/${userId}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch user details');
      }

      const data = await response.json();

      // Get available roles and groups
      const [availableRoles, availableGroups] = await Promise.all([
        this.getAvailableRealmRoles(),
        this.getAvailableGroups()
      ]);

      const organizationUser: OrganizationUser = {
        ...data.user,
        organizationId,
        assignedRoles: data.assignedRealmRoles,
        assignedGroups: data.assignedGroups,
      };

      return {
        user: organizationUser,
        assignedRealmRoles: data.assignedRealmRoles,
        assignedClientRoles: {},
        assignedGroups: data.assignedGroups,
        availableRealmRoles: availableRoles,
        availableClientRoles: {},
        availableGroups: availableGroups,
      };
    } catch (error) {
      console.error('Failed to fetch user details:', error);
      throw new Error('Failed to fetch user details');
    }
  }

  // User Invitation
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
      const response = await fetch(
        `${this.baseUrl}/users/${assignment.userId}/roles`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            roles: assignment.roles,
            action: assignment.action,
          }),
        }
      );

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
      const response = await fetch(
        `${this.baseUrl}/users/${assignment.userId}/groups`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            groups: assignment.groups,
            action: assignment.action,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to assign/unassign groups');
      }
    } catch (error) {
      console.error('Failed to assign/unassign groups:', error);
      throw new Error('Failed to assign/unassign groups');
    }
  }

  // Available Options
  async getAvailableRealmRoles(): Promise<RoleRepresentation[]> {
    try {
      const response = await fetch(`${this.baseUrl}/roles`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch available roles');
      }

      return await response.json();
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

      return await response.json();
    } catch (error) {
      console.error('Failed to fetch available groups:', error);
      throw new Error('Failed to fetch available groups');
    }
  }

  // Placeholder methods for compatibility
  async inviteExistingUser(organizationId: string, userId: string): Promise<void> {
    // This would require additional implementation
    throw new Error('Invite existing user not implemented yet');
  }

  async removeUserFromOrganization(organizationId: string, userId: string): Promise<void> {
    // This would require additional implementation
    throw new Error('Remove user from organization not implemented yet');
  }

  async assignClientRoles(
    userId: string,
    clientId: string,
    roles: RoleRepresentation[],
    action: 'assign' | 'unassign'
  ): Promise<void> {
    // This would require additional implementation
    throw new Error('Client role assignment not implemented yet');
  }

  async getUserAvailableRealmRoles(userId: string): Promise<RoleRepresentation[]> {
    // For now, return all roles minus assigned ones
    // This would require additional API implementation
    return this.getAvailableRealmRoles();
  }

  async getUserAvailableClientRoles(
    userId: string,
    clientId: string
  ): Promise<RoleRepresentation[]> {
    // This would require additional implementation
    return [];
  }
}

// Default service instance
export const userManagementService = new UserManagementService();
