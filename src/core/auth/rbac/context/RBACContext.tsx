'use client';

import React, { createContext, useContext, useCallback } from 'react';
import {UserDTO} from "@/core";

// RBAC context type
export interface RBACContextValue {
  hasRole: (role: string | string[], options?: { requireAll?: boolean }) => boolean;
  hasPermission: (permission: string | string[], options?: { requireAll?: boolean }) => boolean;
  userRoles: string[];
  userPermissions: string[];
}

// Create the RBAC context
const RBACContext = createContext<RBACContextValue | undefined>(undefined);

// Hook to use the RBAC context
export const useRBAC = (): RBACContextValue => {
  const context = useContext(RBACContext);
  if (!context) {
    throw new Error('useRBAC must be used within an RBACProvider');
  }
  return context;
};

export interface RBACProviderProps {
  children: React.ReactNode;
  user: UserDTO | null;
}

/**
 * RBAC provider component
 *
 * Provides role-based access control functionality
 */
export const RBACProvider: React.FC<RBACProviderProps> = ({ children, user }) => {
  // Role checking function
  const hasRole = useCallback(
    (role: string | string[], options?: { requireAll?: boolean }): boolean => {
      if (!user || !user.roles) return false;

      if (Array.isArray(role)) {
        return options?.requireAll
          ? role.every(r => user.roles?.includes(r))
          : role.some(r => user.roles?.includes(r));
      }

      return user.roles.includes(role);
    },
    [user]
  );

  // Permission checking function
  const hasPermission = useCallback(
    (permission: string | string[], options?: { requireAll?: boolean }): boolean => {
      if (!user || !user.roles) return false;

      if (Array.isArray(permission)) {
        return options?.requireAll
          ? permission.every(p => user.roles?.includes(p))
          : permission.some(p => user.roles?.includes(p));
      }

      return user.roles.includes(permission);
    },
    [user]
  );

  // Context value
  const rbacContextValue: RBACContextValue = {
    hasRole,
    hasPermission,
    userRoles: user?.roles || [],
    userPermissions: user?.roles || [],
  };

  return <RBACContext.Provider value={rbacContextValue}>{children}</RBACContext.Provider>;
};

export { RBACContext };
