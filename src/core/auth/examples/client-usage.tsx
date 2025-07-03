/**
 * Example Component Usage
 * Demonstrates proper Spring Auth implementation patterns
 */

'use client';

import { PermissionGuard, useUserRoles, usePermission } from '@/core/auth/client';

// Example 1: Simple Permission Guard
export function UserManagementPanel() {
  return (
    <PermissionGuard requiredPermission="users:read">
      <div>
        <h2>User Management</h2>
        <UserList />
      </div>
    </PermissionGuard>
  );
}

// Example 2: Role-based Hook Usage
export function UserRoleDisplay() {
  const { roles, groups, isLoading, error } = useUserRoles();

  if (isLoading) {
    return <div className="animate-pulse">Loading user roles...</div>;
  }

  if (error) {
    return <div className="text-red-500">Error loading roles: {error}</div>;
  }

  return (
    <div className="space-y-2">
      <div>
        <strong>Roles ({roles.length}):</strong> {roles.join(', ') || 'None'}
      </div>
      <div>
        <strong>Groups ({groups.length}):</strong> {groups.join(', ') || 'None'}
      </div>
    </div>
  );
}

// Example 3: Conditional Rendering with Permission Hook
export function ActionButtons() {
  const { hasPermission: canCreate, isLoading: checkingCreate } = usePermission('users:create');
  const { hasPermission: canDelete, isLoading: checkingDelete } = usePermission('users:delete');

  if (checkingCreate || checkingDelete) {
    return <div>Checking permissions...</div>;
  }

  return (
    <div className="space-x-2">
      {canCreate && (
        <button className="bg-blue-500 text-white px-4 py-2 rounded">
          Create User
        </button>
      )}
      {canDelete && (
        <button className="bg-red-500 text-white px-4 py-2 rounded">
          Delete User
        </button>
      )}
    </div>
  );
}

// Helper components (would be defined elsewhere)
function UserList() {
  return <div>User list component</div>;
}
