/**
 * Entity Management Permissions Service
 * Provides helpers for checking and processing entity permissions
 */

import { EntityPermissions } from '../../types';

/**
 * Current permissions service version
 */
export const PERMISSIONS_SERVICE_VERSION = '1.0.0';

/**
 * Permission requirement configuration
 */
export interface PermissionRequirement {
  feature: string;
  action: string;
}

/**
 * Checks if a user has the required permission based on the EntityPermissions config
 * 
 * @param permissions The entity permissions configuration
 * @param operation The operation being performed ('view', 'create', 'update', 'delete')
 * @param userPermissionCheckFn Function to check if user has permission
 * @returns Whether the user has permission
 */
export function checkEntityPermission(
  permissions: EntityPermissions | undefined,
  operation: 'view' | 'create' | 'update' | 'delete',
  userPermissionCheckFn: (feature: string, action: string) => boolean
): boolean {
  // If no permissions are specified, allow the operation
  if (!permissions) {
    return true;
  }
  
  // Get the permission needed for this operation
  const { feature } = permissions;
  const action = permissions[operation];
  
  // If no action is specified for this operation, allow it
  if (!action) {
    return true;
  }
  
  // Check if the user has this permission
  return userPermissionCheckFn(feature, action);
}

/**
 * Creates a permission object based on entity permissions and operation
 * 
 * @param permissions The entity permissions configuration
 * @param operation The operation being performed ('view', 'create', 'update', 'delete')
 * @returns Permission requirement object or undefined if no permission needed
 */
export function createPermissionRequirement(
  permissions: EntityPermissions | undefined,
  operation: 'view' | 'create' | 'update' | 'delete'
): PermissionRequirement | undefined {
  // If no permissions are specified, no requirement
  if (!permissions) {
    return undefined;
  }
  
  // Get the permission needed for this operation
  const { feature } = permissions;
  const action = permissions[operation];
  
  // If no action is specified for this operation, no requirement
  if (!action) {
    return undefined;
  }
  
  return { feature, action };
}

/**
 * Get entity operation permission attributes for a component
 * Used for attaching data attributes to components for permission checking
 * 
 * @param permissions The entity permissions configuration
 * @param operation The operation being performed ('view', 'create', 'update', 'delete')
 * @returns Data attributes object for the component
 */
export function getPermissionAttributes(
  permissions: EntityPermissions | undefined,
  operation: 'view' | 'create' | 'update' | 'delete'
): Record<string, string> {
  // If no permissions are specified, return empty object
  if (!permissions) {
    return {};
  }
  
  // Get the permission needed for this operation
  const { feature } = permissions;
  const action = permissions[operation];
  
  // If no action is specified for this operation, return empty object
  if (!action) {
    return {};
  }
  
  return {
    'data-permission-feature': feature,
    'data-permission-action': action
  };
}
