/**
 * User Management Types
 * These types define the data structures used in the user management feature
 */

import type {
  GroupRepresentation,
  MemberRepresentation,
  OrganizationRepresentation,
  RoleRepresentation,
} from '@/core/api/generated/keycloak';

export interface EnhancedMemberRepresentation extends MemberRepresentation {
  groups?: string[];
  groupDetails?: GroupRepresentation[];
  realmRoles?: string[];
  roleDetails?: RoleRepresentation[];
}

export interface OrganizationUser extends MemberRepresentation {
  id?: string;
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  enabled?: boolean;
  emailVerified?: boolean;
  createdTimestamp?: number;

  organizationId: string;
  organizationName?: string;
  membershipId?: string;

  assignedRoles?: RoleRepresentation[];
  assignedGroups?: GroupRepresentation[];
}

export interface UserInvitation {
  email: string;
  firstName?: string;
  lastName?: string;
  organizationId: string;
  sendWelcomeEmail?: boolean;
}

export interface BulkUserInvitation {
  invitations: UserInvitation[];
  organizationId: string;
}

export interface RoleAssignment {
  userId: string;
  organizationId: string;
  roles: RoleRepresentation[];
  action: 'assign' | 'unassign';
}

export interface GroupAssignment {
  userId: string;
  organizationId: string;
  groups: GroupRepresentation[];
  action: 'assign' | 'unassign';
}

export interface UserFilters {
  search?: string;
  enabled?: boolean;
  emailVerified?: boolean;
  role?: string;
  group?: string;
  page?: number;
  size?: number;
}

export interface UserListResponse {
  users: OrganizationUser[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
}

export interface AvailableRolesResponse {
  realmRoles: RoleRepresentation[];
  clientRoles: Record<string, RoleRepresentation[]>;
}

export interface AvailableGroupsResponse {
  groups: GroupRepresentation[];
}

export interface InviteUserFormData {
  email: string;
  firstName: string;
  lastName: string;
  sendWelcomeEmail: boolean;
}

export interface BulkInviteFormData {
  csvFile?: File;
  manualInvitations: InviteUserFormData[];
}

export interface UserDetailData {
  user: OrganizationUser;
  assignedRealmRoles: RoleRepresentation[];
  assignedClientRoles: Record<string, RoleRepresentation[]>;
  assignedGroups: GroupRepresentation[];
  availableRealmRoles: RoleRepresentation[];
  availableClientRoles: Record<string, RoleRepresentation[]>;
  availableGroups: GroupRepresentation[];
}

export type InvitationStatus = 'pending' | 'accepted' | 'expired' | 'cancelled';

export interface PendingInvitation {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  organizationId: string;
  organizationName?: string;

  status: InvitationStatus;
  invitedBy: string;
  invitedByName?: string;
  invitedAt: number;
  expiresAt?: number;
  lastSentAt?: number;

  selectedGroups: GroupRepresentation[];
  selectedRoles?: RoleRepresentation[];

  sendWelcomeEmail?: boolean;
  invitationNote?: string;
}

export interface UserInvitationWithGroups {
  email: string;
  userId?: string;
  firstName?: string;
  lastName?: string;
  organizationId: string;
  sendWelcomeEmail?: boolean;
  sendPasswordReset?: boolean;

  selectedGroups?: GroupRepresentation[];
  selectedRoles?: RoleRepresentation[];
  invitationNote?: string;

  redirectUri?: string;
}

export interface InviteUserFormDataWithGroups {
  email: string;
  firstName: string;
  lastName: string;
  sendWelcomeEmail: boolean;
  sendPasswordReset?: boolean;
  selectedGroups: string[];
  selectedRoles?: string[];
  invitationNote?: string;
  redirectUri?: string;
}

export interface BulkInviteFormDataWithGroups {
  csvFile?: File;
  manualInvitations: InviteUserFormDataWithGroups[];
  defaultGroups?: string[];
  defaultRoles?: string[];
}

export interface OrganizationWithInvitations {
  organization: OrganizationRepresentation;
  members: OrganizationUser[];
  pendingInvitations: PendingInvitation[];
  totalMembers: number;
  totalPendingInvitations: number;
}

export interface InvitationListResponse {
  invitations: PendingInvitation[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
}

export interface InvitationActionResult {
  success: boolean;
  message: string;
  invitationId?: string;
  email?: string;
  userId?: string;
  firstName?: string;
  lastName?: string;
  errors?: string[];
}

export interface InvitationFilters {
  status?: InvitationStatus[];
  search?: string;
  invitedBy?: string;
  dateRange?: {
    from?: Date;
    to?: Date;
  };
  hasGroups?: boolean;
  page?: number;
  size?: number;
}

export interface UserManagementError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

export interface LoadingStates {
  users: boolean;
  roles: boolean;
  groups: boolean;
  invitation: boolean;
  assignment: boolean;
}

export interface OrganizationContext {
  organizationId: string;
  organizationName: string;
  userRole: string;
  permissions: string[];
}
