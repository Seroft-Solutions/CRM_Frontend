/**
 * User Management Types
 * These types define the data structures used in the user management feature
 */

import type {
  UserRepresentation,
  RoleRepresentation,
  GroupRepresentation,
  OrganizationRepresentation,
  MemberRepresentation,
} from '@/core/api/generated/keycloak';

// Enhanced member representation with parallel-loaded groups and roles
export interface EnhancedMemberRepresentation extends MemberRepresentation {
  groups?: string[]; // Array of group names
  groupDetails?: GroupRepresentation[]; // Full group objects
  realmRoles?: string[]; // Array of role names
  roleDetails?: RoleRepresentation[]; // Full role objects
}

// Extended user representation with organization context
export interface OrganizationUser extends MemberRepresentation {
  // User basic info
  id?: string;
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  enabled?: boolean;
  emailVerified?: boolean;
  createdTimestamp?: number;

  // Organization context
  organizationId: string;
  organizationName?: string;
  membershipId?: string;

  // Role and group assignments (loaded separately)
  assignedRoles?: RoleRepresentation[];
  assignedGroups?: GroupRepresentation[];
}

// User invitation data
export interface UserInvitation {
  email: string;
  firstName?: string;
  lastName?: string;
  organizationId: string;
  sendWelcomeEmail?: boolean;
}

// Bulk user invitation
export interface BulkUserInvitation {
  invitations: UserInvitation[];
  organizationId: string;
}

// Role assignment data
export interface RoleAssignment {
  userId: string;
  organizationId: string;
  roles: RoleRepresentation[];
  action: 'assign' | 'unassign';
}

// Group assignment data
export interface GroupAssignment {
  userId: string;
  organizationId: string;
  groups: GroupRepresentation[];
  action: 'assign' | 'unassign';
}

// User management filters
export interface UserFilters {
  search?: string;
  enabled?: boolean;
  emailVerified?: boolean;
  role?: string;
  group?: string;
  page?: number;
  size?: number;
}

// API response types
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

// Form types
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

// User detail page data
export interface UserDetailData {
  user: OrganizationUser;
  assignedRealmRoles: RoleRepresentation[];
  assignedClientRoles: Record<string, RoleRepresentation[]>;
  assignedGroups: GroupRepresentation[];
  availableRealmRoles: RoleRepresentation[];
  availableClientRoles: Record<string, RoleRepresentation[]>;
  availableGroups: GroupRepresentation[];
}

// ENHANCED: Invitation Status Tracking
export type InvitationStatus = 'pending' | 'accepted' | 'expired' | 'cancelled';

export interface PendingInvitation {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  organizationId: string;
  organizationName?: string;

  // Invitation tracking
  status: InvitationStatus;
  invitedBy: string;
  invitedByName?: string;
  invitedAt: number; // timestamp
  expiresAt?: number; // timestamp
  lastSentAt?: number; // timestamp

  // Group assignment
  selectedGroups: GroupRepresentation[];
  selectedRoles?: RoleRepresentation[];

  // Metadata
  sendWelcomeEmail?: boolean;
  invitationNote?: string;
}

// ENHANCED: Invitation with Group Selection
export interface UserInvitationWithGroups {
  email: string;
  firstName?: string;
  lastName?: string;
  organizationId: string;
  sendWelcomeEmail?: boolean;
  sendPasswordReset?: boolean; // Send UPDATE_PASSWORD email (defaults to invitation email)

  // Group and role assignment
  selectedGroups?: GroupRepresentation[];
  selectedRoles?: RoleRepresentation[];
  invitationNote?: string;

  // Optional redirect after password setup
  redirectUri?: string;
}

// ENHANCED: Form types with group selection
export interface InviteUserFormDataWithGroups {
  email: string;
  firstName: string;
  lastName: string;
  sendWelcomeEmail: boolean;
  sendPasswordReset?: boolean; // Send UPDATE_PASSWORD email (defaults to invitation email)
  selectedGroups: string[]; // Group IDs
  selectedRoles?: string[]; // Role IDs
  invitationNote?: string;
  redirectUri?: string; // Post-password setup redirect
}

export interface BulkInviteFormDataWithGroups {
  csvFile?: File;
  manualInvitations: InviteUserFormDataWithGroups[];
  defaultGroups?: string[]; // Group IDs
  defaultRoles?: string[]; // Role IDs
}

// ENHANCED: Organization with invitation tracking
export interface OrganizationWithInvitations {
  organization: OrganizationRepresentation;
  members: OrganizationUser[];
  pendingInvitations: PendingInvitation[];
  totalMembers: number;
  totalPendingInvitations: number;
}

// ENHANCED: API response types
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
  errors?: string[];
}

// ENHANCED: Invitation filters
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

// Error types
export interface UserManagementError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

// Loading states
export interface LoadingStates {
  users: boolean;
  roles: boolean;
  groups: boolean;
  invitation: boolean;
  assignment: boolean;
}

// Organization context
export interface OrganizationContext {
  organizationId: string;
  organizationName: string;
  userRole: string; // The role of current user in this organization
  permissions: string[]; // User's permissions in this organization
}
