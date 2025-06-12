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
import { useUserOrganizations } from '@/hooks/useUserOrganizations';

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
  setError: (error: string) => void;
  checkSetupStatus: () => void;
  setShowWelcome: (show: boolean) => void;
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
  const { data: organizations, isLoading: orgLoading, refetch: refetchOrganizations } = useUserOrganizations();
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
    onSuccess: (result, variables) => {
      // Keep setup in progress to show progress tracking component
      setState(prev => ({
        ...prev,
        isSetupInProgress: true, // Keep true to trigger progress tracking
        error: null,
        organizationName: variables.organizationName, // Set organization name for progress tracking
      }));
      // Refetch organizations after setup
      refetchOrganizations();
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
        // Keep sync in progress to show progress tracking component
        setState(prev => ({
          ...prev,
          isSyncInProgress: true, // Keep true to trigger progress tracking
          error: null,
          // organizationName should already be set from checkSetupStatus
        }));
        queryClient.invalidateQueries({ queryKey: ['session'] });
        // Refetch organizations after sync
        refetchOrganizations();
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

  // Check if setup is required based on API organizations
  const checkSetupStatus = useCallback(() => {
    if (status === 'loading' || orgLoading) return;

    const userHasOrganization = !!organizations?.length;
    const primaryOrg = organizations?.[0] || null;

    console.log('=== ORGANIZATION SETUP CHECK ===');
    console.log('Session status:', status);
    console.log('Organizations loading:', orgLoading);
    console.log('Organizations data:', organizations);
    console.log('User has organization:', userHasOrganization);
    console.log('Primary organization:', primaryOrg);
    console.log('=== END SETUP CHECK ===');

    setState(prev => ({
      ...prev,
      isSetupRequired: !userHasOrganization,
      isSetupCompleted: userHasOrganization,
      organizationName: primaryOrg?.name || null,
    }));
  }, [status, orgLoading, organizations]);

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

  // Set error
  const setError = useCallback((error: string) => {
    setState(prev => ({ ...prev, error, isSetupInProgress: false, isSyncInProgress: false }));
  }, []);

  // Set show welcome
  const setShowWelcome = useCallback((show: boolean) => {
    setState(prev => ({ ...prev, showWelcome: show }));
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
      setError,
      checkSetupStatus,
      setShowWelcome,
    },
  };
}
