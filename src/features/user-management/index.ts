/**
 * User Management Feature Exports
 * Centralized exports for the user management feature
 */

// Components
export { OrganizationUsers } from './components/OrganizationUsers';
export { UserDetails } from './components/UserDetails';

// Utility Components
export { UserAvatar } from './components/UserAvatar';
export { UserStatusBadge } from './components/UserStatusBadge';
export { RolesBadgesList } from './components/RolesBadgesList';
export { GroupsBadgesList } from './components/GroupsBadgesList';
export { UserCard } from './components/UserCard';

// Services
export { UserManagementService, userManagementService } from './services/user-management.service';

// Configuration
export { USER_MANAGEMENT_CONFIG } from './config';

// Types
export type {
  OrganizationUser,
  UserInvitation,
  UserInvitationWithGroups,
  BulkUserInvitation,
  RoleAssignment,
  GroupAssignment,
  UserFilters,
  UserListResponse,
  AvailableRolesResponse,
  AvailableGroupsResponse,
  InviteUserFormData,
  InviteUserFormDataWithGroups,
  BulkInviteFormData,
  UserDetailData,
  UserManagementError,
  LoadingStates,
  OrganizationContext,
  PendingInvitation,
  InvitationStatus,
  InvitationActionResult,
  InvitationListResponse,
  OrganizationWithInvitations,
} from './types';
