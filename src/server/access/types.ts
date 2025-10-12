/**
 * Access Management shared types
 * Centralises invitation data structures for staff and partners.
 */

export type AccessInviteType = 'user' | 'partner';

export type AccessInviteStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'EXPIRED'
  | 'CANCELLED';

export interface AccessRoleDescriptor {
  id: string;
  name?: string;
}

export interface AccessGroupDescriptor {
  id: string;
  name?: string;
}

export interface StaffAccessMetadata {
  roles?: AccessRoleDescriptor[];
  groups: AccessGroupDescriptor[];
  note?: string;
}

export interface PartnerAccessMetadata {
  channelType: {
    id: number;
    name?: string;
  };
  commissionPercent?: number;
  groups?: AccessGroupDescriptor[]; // Optional - Business Partner group is auto-assigned by backend
  note?: string;
}

export type AccessInviteMetadata = StaffAccessMetadata | PartnerAccessMetadata;

export interface AccessInviteRecord<T extends AccessInviteMetadata = AccessInviteMetadata> {
  inviteId: string;
  userId: string;
  organizationId: string;
  type: AccessInviteType;
  status: AccessInviteStatus;
  metadata: T;
  firstName: string;
  lastName: string;
  email: string;
  emailVerified: boolean;
  createdAt: string;
  expiresAt: string;
  joinedAt?: string;
  secretHash?: string;
}

export interface AccessInviteListResponse<T extends AccessInviteMetadata = AccessInviteMetadata> {
  invitations: AccessInviteRecord<T>[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
}

export interface AccessInviteCreateInput<T extends AccessInviteMetadata = AccessInviteMetadata> {
  type: AccessInviteType;
  organizationId: string;
  firstName: string;
  lastName: string;
  email: string;
  metadata: T;
}

export interface AccessInviteTokenPayload {
  inviteId: string;
  organizationId: string;
  type: AccessInviteType;
  userId: string;
  exp: number;
}

export interface AccessInviteAcceptanceResult {
  userId: string;
  invitationId: string;
  organizationId: string;
  status: AccessInviteStatus;
  emailVerified: boolean;
  appliedGroups?: AccessGroupDescriptor[];
  appliedRoles?: AccessRoleDescriptor[];
}
