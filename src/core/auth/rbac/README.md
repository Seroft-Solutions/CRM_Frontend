# RBAC (Role-Based Access Control) Module

This module provides role-based and permission-based access control for your application.

## Overview

The RBAC module enables you to:

- Check if a user has specific roles
- Check if a user has specific permissions
- Conditionally render UI elements based on roles/permissions
- Protect routes based on roles/permissions
- Support role hierarchies (e.g., admin inherits all other roles)
- Support wildcard permissions (e.g., "users:\*" matches "users:create", "users:edit", etc.)

## Architecture

The module follows a clear separation of concerns:

- **context/RBACContext.tsx**: Provides RBAC state and methods
- **hooks/rbac.hooks.ts**: React hooks for permission and role checking
- **utils/rbac.utils.ts**: Utility functions for RBAC operations
- **components/**: UI components that leverage RBAC functionality
- **guards/**: Components that protect content based on permissions/roles
- **types/**: TypeScript types for RBAC functionality

## Usage

### Basic Setup

The RBAC provider is automatically included when you use the AuthProvider:

```tsx
import { AuthProvider, createTokenService } from '@/core/auth';

// Create a token service
const tokenService = createTokenService({
  tokenKey: 'my_app_token',
  refreshTokenKey: 'my_app_refresh_token',
});

// RBAC configuration (optional)
const rbacConfig = {
  strictMode: false, // If true, throws errors on missing permissions
  wildcardChar: '*', // Character used for wildcard permissions
  roleHierarchy: {
    admin: ['editor', 'viewer'], // admin inherits editor and viewer roles
    editor: ['viewer'], // editor inherits viewer role
  },
};

// Wrap your application with the auth provider
function App() {
  return (
    <AuthProvider tokenService={tokenService} enableAutoLogin={true} rbacConfig={rbacConfig}>
      <YourApplication />
    </AuthProvider>
  );
}
```

### Checking Roles and Permissions

```tsx
import { useHasRole, useHasPermission } from '@/core/auth/rbac';

function AdminSection() {
  // Check if user has a role
  const isAdmin = useHasRole('admin');

  // Check if user has a permission
  const canManageUsers = useHasPermission('users:manage');

  if (!isAdmin) {
    return <AccessDenied />;
  }

  return (
    <div>
      <h1>Admin Section</h1>
      {canManageUsers && <UserManagementPanel />}
    </div>
  );
}
```

### Using RBAC Guards

```tsx
import { RoleGuard, PermissionGuard } from '@/core/auth/rbac';

function AdminDashboard() {
  return (
    <div>
      <h1>Dashboard</h1>

      {/* Only visible to admins */}
      <RoleGuard role="admin">
        <AdminControls />
      </RoleGuard>

      {/* Only visible to users with the 'users:manage' permission */}
      <PermissionGuard permission="users:manage">
        <UserManagementPanel />
      </PermissionGuard>

      {/* You can check multiple roles/permissions */}
      <RoleGuard role={['admin', 'editor']} options={{ requireAll: false }}>
        <ContentEditorPanel />
      </RoleGuard>

      {/* Provide fallback content for unauthorized users */}
      <PermissionGuard permission="reports:view" fallback={<RequestAccessButton />}>
        <ReportsPanel />
      </PermissionGuard>
    </div>
  );
}
```

### Advanced RBAC Hooks

```tsx
import {
  useRole,
  useAllRoles,
  useAnyRole,
  usePermission,
  useAllPermissions,
  useAnyPermission,
  useUserRoles,
  useUserPermissions
} from '@/core/auth/rbac';

function AdvancedPermissionsExample() {
  // Check if user has a specific role
  const isAdmin = useRole('admin');

  // Check if user has ALL of these roles
  const isSuperAdmin = useAllRoles(['admin', 'developer']);

  // Check if user has ANY of these roles
  const isContentManager = useAnyRole(['admin', 'editor', 'content-manager']);

  // Check if user has a specific permission
  const canEditUsers = usePermission('users:edit');

  // Check if user has ALL of these permissions
  const canFullyManageUsers = useAllPermissions([
    'users:create',
    'users:edit',
    'users:delete'
  ]);

  // Check if user has ANY of these permissions
  const canInteractWithUsers = useAnyPermission([
    'users:view',
    'users:edit'
  ]);

  // Get all user roles
  const userRoles = useUserRoles();

  // Get all user permissions
  const userPermissions = useUserPermissions();

  return (/* UI based on permissions/roles */);
}
```

## Permission Format

Permissions follow the format `resource:action`, for example:

- `users:create`
- `users:edit`
- `users:delete`
- `posts:publish`

Wildcards can be used to match multiple permissions:

- `users:*` - Matches any action on users
- `*:create` - Matches create action on any resource
- `*:*` - Matches any permission (super admin)

## Role Hierarchy

Roles can inherit permissions from other roles by configuring the role hierarchy:

```tsx
const rbacConfig = {
  roleHierarchy: {
    admin: ['editor', 'viewer'], // admin inherits editor and viewer roles
    editor: ['viewer'], // editor inherits viewer role
  },
};
```

In this example:

- Users with the 'admin' role automatically have 'editor' and 'viewer' roles
- Users with the 'editor' role automatically have the 'viewer' role
