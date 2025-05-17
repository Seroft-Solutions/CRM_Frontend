/**
 * RBAC type definitions
 */

// Permission type (string identifier for a permission)
export type Permission = string;

// Role type (string identifier for a role)
export type Role = string;

// Options for role checking
export interface RoleCheckOptions {
  // Whether all roles are required (AND) or any role is sufficient (OR)
  requireAll?: boolean;
}

// Options for permission checking
export interface PermissionCheckOptions {
  // Whether all permissions are required (AND) or any permission is sufficient (OR)
  requireAll?: boolean;
}

// User role and permission information
export interface RBACUserData {
  // Array of role IDs assigned to the user
  roles: Role[];

  // Array of permission IDs granted to the user
  permissions: Permission[];
}
