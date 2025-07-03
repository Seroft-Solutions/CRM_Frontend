/**
 * Spring-Based Authentication Hooks
 * Provides role and permission checking using Spring Database
 * Replaces JWT-based role checking to solve 431 error issues
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { springRoleService } from '../services/spring-role.service';
import type { UserRoleData } from '../services/spring-role.service';

/**
 * Hook to get user roles from Spring Database
 */
export function useUserRoles() {
  const { data: session, status } = useSession();
  const [roles, setRoles] = useState<string[]>([]);
  const [groups, setGroups] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userData, setUserData] = useState<UserRoleData | null>(null);

  const fetchRoles = useCallback(async () => {
    if (!session?.user?.id) {
      setRoles([]);
      setGroups([]);
      setUserData(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const userData = await springRoleService.fetchUserRoles(session.user.id);
      
      if (userData) {
        setRoles(userData.roles);
        setGroups(userData.groups);
        setUserData(userData);
      } else {
        setRoles([]);
        setGroups([]);
        setUserData(null);
        setError('User profile not found in Spring Database');
      }
    } catch (err) {
      console.error('Failed to fetch user roles:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch roles');
      setRoles([]);
      setGroups([]);
      setUserData(null);
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    if (status !== 'loading') {
      fetchRoles();
    }
  }, [status, fetchRoles]);

  const refresh = useCallback(() => {
    if (session?.user?.id) {
      springRoleService.clearUserCache(session.user.id);
      fetchRoles();
    }
  }, [session?.user?.id, fetchRoles]);

  return {
    roles,
    groups,
    userData,
    isLoading,
    error,
    refresh,
    hasData: userData !== null,
  };
}

/**
 * Hook to check if user has a specific permission/role
 */
export function usePermission(permission: string): {
  hasPermission: boolean;
  isLoading: boolean;
  error: string | null;
} {
  const { data: session, status } = useSession();
  const [hasPermission, setHasPermission] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function checkPermission() {
      if (status === 'loading') {
        setIsLoading(true);
        return;
      }

      if (!session?.user?.id) {
        setHasPermission(false);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        
        const hasRole = await springRoleService.hasRole(session.user.id, permission);
        setHasPermission(hasRole);
      } catch (err) {
        console.error('Failed to check permission:', err);
        setError(err instanceof Error ? err.message : 'Failed to check permission');
        setHasPermission(false);
      } finally {
        setIsLoading(false);
      }
    }

    checkPermission();
  }, [session?.user?.id, permission, status]);

  return { hasPermission, isLoading, error };
}

/**
 * Hook to check if user has any of the specified roles
 */
export function useAnyPermission(permissions: string[]): {
  hasAnyPermission: boolean;
  isLoading: boolean;
  error: string | null;
} {
  const { data: session, status } = useSession();
  const [hasAnyPermission, setHasAnyPermission] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function checkPermissions() {
      if (status === 'loading') {
        setIsLoading(true);
        return;
      }

      if (!session?.user?.id) {
        setHasAnyPermission(false);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        
        const hasAny = await springRoleService.hasAnyRole(session.user.id, permissions);
        setHasAnyPermission(hasAny);
      } catch (err) {
        console.error('Failed to check permissions:', err);
        setError(err instanceof Error ? err.message : 'Failed to check permissions');
        setHasAnyPermission(false);
      } finally {
        setIsLoading(false);
      }
    }

    checkPermissions();
  }, [session?.user?.id, permissions, status]);

  return { hasAnyPermission, isLoading, error };
}

/**
 * Hook to check if user has all of the specified roles
 */
export function useAllRoles(roles: string[]): {
  hasAllRoles: boolean;
  isLoading: boolean;
  error: string | null;
} {
  const { data: session, status } = useSession();
  const [hasAllRoles, setHasAllRoles] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function checkRoles() {
      if (status === 'loading') {
        setIsLoading(true);
        return;
      }

      if (!session?.user?.id) {
        setHasAllRoles(false);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        
        const hasAll = await springRoleService.hasAllRoles(session.user.id, roles);
        setHasAllRoles(hasAll);
      } catch (err) {
        console.error('Failed to check roles:', err);
        setError(err instanceof Error ? err.message : 'Failed to check roles');
        setHasAllRoles(false);
      } finally {
        setIsLoading(false);
      }
    }

    checkRoles();
  }, [session?.user?.id, roles, status]);

  return { hasAllRoles, isLoading, error };
}
