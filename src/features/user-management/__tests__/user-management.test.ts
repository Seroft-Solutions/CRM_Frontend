/**
 * User Management Feature Tests
 * Basic tests to verify the feature structure and exports
 */

import { 
  OrganizationUsers,
  InviteUsers,
  UserDetails,
  UserAvatar,
  UserStatusBadge,
  RolesBadgesList,
  GroupsBadgesList,
  UserCard,
  UserManagementService,
  userManagementService,
  USER_MANAGEMENT_CONFIG,
  useOrganizationUsers,
  useUserDetails,
  useInviteUser
} from '../index';

describe('User Management Feature', () => {
  test('should export all components', () => {
    expect(OrganizationUsers).toBeDefined();
    expect(InviteUsers).toBeDefined();
    expect(UserDetails).toBeDefined();
    expect(UserAvatar).toBeDefined();
    expect(UserStatusBadge).toBeDefined();
    expect(RolesBadgesList).toBeDefined();
    expect(GroupsBadgesList).toBeDefined();
    expect(UserCard).toBeDefined();
  });

  test('should export service classes', () => {
    expect(UserManagementService).toBeDefined();
    expect(userManagementService).toBeDefined();
    expect(userManagementService).toBeInstanceOf(UserManagementService);
  });

  test('should export configuration', () => {
    expect(USER_MANAGEMENT_CONFIG).toBeDefined();
    expect(USER_MANAGEMENT_CONFIG.DEFAULT_PAGE_SIZE).toBe(20);
    expect(USER_MANAGEMENT_CONFIG.FEATURES).toBeDefined();
  });

  test('should export hooks', () => {
    expect(useOrganizationUsers).toBeDefined();
    expect(useUserDetails).toBeDefined();
    expect(useInviteUser).toBeDefined();
  });
});

// Mock data for testing
export const mockUser = {
  id: '1',
  username: 'john.doe',
  email: 'john.doe@example.com',
  firstName: 'John',
  lastName: 'Doe',
  enabled: true,
  emailVerified: true,
  createdTimestamp: Date.now(),
  organizationId: 'org-1',
  organizationName: 'Test Organization',
  assignedRoles: [
    { id: 'role-1', name: 'User', description: 'Basic user role' },
    { id: 'role-2', name: 'Manager', description: 'Management role' }
  ],
  assignedGroups: [
    { id: 'group-1', name: 'Employees', path: '/employees' },
    { id: 'group-2', name: 'Marketing', path: '/employees/marketing' }
  ]
};

export const mockInvitation = {
  email: 'new.user@example.com',
  firstName: 'New',
  lastName: 'User',
  organizationId: 'org-1',
  sendWelcomeEmail: true
};
