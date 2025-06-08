'use client';

import { useState, useCallback, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  OrganizationSetupService,
  type OrganizationSetupRequest,
  type OrganizationSetupResult,
} from '@/services/organization/organization-setup.service';
import { OrganizationSyncService } from '@/services/organization/organization-sync.service';
import { hasOrganization, getPrimaryOrganization as getPrimaryOrgFromSession } from '@/lib/organization-utils';

export interface OrganizationSetupState {
  isSetupRequired: boolean;
  isSetupInProgress: boolean;
  isSetupCompleted: boolean;
  isSyncInProgress: boolean;
  showWelcome: boolean;
  error: string | null;
  organizationName: string | null;
}

export interface OrganizationSetupActions {
  setupOrganization: (request: OrganizationSetupRequest) => Promise<void>;
  syncExistingData: () => Promise<void>;
  clearError: () => void;
  checkSetupStatus: () => void;
}

export interface UseOrganizationSetupResult {
  state: OrganizationSetupState;
  actions: OrganizationSetupActions;
}

/**
 * Hook for managing organization setup and sync process
 */
export function useOrganizationSetup(): UseOrganizationSetupResult {
  const { data: session, status } = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [state, setState] = useState<OrganizationSetupState>({
    isSetupRequired: false,
    isSetupInProgress: false,
    isSetupCompleted: false,
    isSyncInProgress: false,
    showWelcome: false,
    error: null,
    organizationName: null,
  });

  // Initialize services
  const setupService = new OrganizationSetupService();
  const syncService = new OrganizationSyncService();

  // Setup mutation for new organizations
  const setupMutation = useMutation({
    mutationFn: async (request: OrganizationSetupRequest): Promise<OrganizationSetupResult> => {
      if (!session) throw new Error('No active session');
      return setupService.setupOrganization(request, session);
    },
    onMutate: () => {
      setState(prev => ({ ...prev, isSetupInProgress: true, error: null }));
    },
    onSuccess: () => {
      setState(prev => ({
        ...prev,
        isSetupInProgress: false,
        isSetupCompleted: true,
        isSetupRequired: false,
        showWelcome: true,
      }));
    },
    onError: (error: Error) => {
      setState(prev => ({
        ...prev,
        isSetupInProgress: false,
        error: error.message,
      }));
    },
  });

  // Sync mutation for existing Keycloak data
  const syncMutation = useMutation({
    mutationFn: async () => {
      if (!session) throw new Error('No active session');
      return syncService.syncUserData(session);
    },
    onMutate: () => {
      setState(prev => ({ ...prev, isSyncInProgress: true, error: null }));
    },
    onSuccess: (result) => {
      if (result.errors.length > 0) {
        setState(prev => ({
          ...prev,
          isSyncInProgress: false,
          error: `Sync completed with warnings: ${result.errors.join(', ')}`,
        }));
      } else {
        setState(prev => ({
          ...prev,
          isSyncInProgress: false,
          isSetupCompleted: true,
          isSetupRequired: false,
        }));
        queryClient.invalidateQueries({ queryKey: ['session'] });
        setTimeout(() => router.push('/dashboard'), 1000);
      }
    },
    onError: (error: Error) => {
      setState(prev => ({
        ...prev,
        isSyncInProgress: false,
        error: error.message,
      }));
    },
  });

  // Check if setup is required based on session
  const checkSetupStatus = useCallback(() => {
    if (status === 'loading') return;

    const userHasOrganization = hasOrganization(session);
    const primaryOrg = getPrimaryOrgFromSession(session);

    setState(prev => ({
      ...prev,
      isSetupRequired: !userHasOrganization,
      isSetupCompleted: userHasOrganization,
      organizationName: primaryOrg?.name || null,
    }));
  }, [session, status]);

  // Setup organization
  const setupOrganization = useCallback(
    async (request: OrganizationSetupRequest) => {
      await setupMutation.mutateAsync(request);
    },
    [setupMutation]
  );

  // Sync existing data
  const syncExistingData = useCallback(
    async () => {
      await syncMutation.mutateAsync();
    },
    [syncMutation]
  );

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Auto-check setup status when session changes
  useEffect(() => {
    checkSetupStatus();
  }, [checkSetupStatus]);

  return {
    state,
    actions: {
      setupOrganization,
      syncExistingData,
      clearError,
      checkSetupStatus,
    },
  };
}

/**
 * Utility function to determine if organization setup is needed
 */
export function isOrganizationSetupNeeded(session: any): boolean {
  return !hasOrganization(session);
}

/**
 * Utility function to get primary organization
 */
export function getPrimaryOrganization(session: any) {
  return getPrimaryOrgFromSession(session);
}
