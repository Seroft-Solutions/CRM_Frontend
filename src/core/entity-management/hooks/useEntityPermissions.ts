import { useMemo } from 'react';
import { useAuth } from '@/features/core/auth';
import { EntityPermissions } from '../types';

/**
 * Props for the useEntityPermissions hook
 */
interface UseEntityPermissionsProps {
  permissions?: EntityPermissions;
}

/**
 * Hook to check entity-related permissions
 */
export function useEntityPermissions({ permissions }: UseEntityPermissionsProps) {
  const { hasPermission } = useAuth();
  
  // Calculate permission flags only once
  const permissionFlags = useMemo(() => {
    // If no permissions config is provided, assume user has all permissions
    if (!permissions) {
      return {
        canView: true,
        canCreate: true,
        canUpdate: true,
        canDelete: true,
      };
    }
    
    // Check each permission against the auth system
    return {
      canView: hasPermission(permissions.feature, permissions.view || 'VIEW'),
      canCreate: permissions.create ? hasPermission(permissions.feature, permissions.create) : false,
      canUpdate: permissions.update ? hasPermission(permissions.feature, permissions.update) : false,
      canDelete: permissions.delete ? hasPermission(permissions.feature, permissions.delete) : false,
    };
  }, [permissions, hasPermission]);
  
  return permissionFlags;
}
