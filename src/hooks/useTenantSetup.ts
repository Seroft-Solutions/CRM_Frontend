'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { 
  useGetTenantInfo, 
  useInitiateSetup, 
  useGetSetupProgress 
} from '@/core/api/generated/spring/endpoints/tenant-setup-controller/tenant-setup-controller.gen';
import { 
  TenantSetupRequestDTO, 
  TenantSetupProgressDTO, 
  TenantInfoDTO,
  TenantSetupProgressDTOStatus 
} from '@/core/api/generated/spring/schemas';

export interface TenantSetupState {
  // Tenant info
  tenantInfo: TenantInfoDTO | null;
  
  // Setup state
  isSetupRequired: boolean;
  isSetupInProgress: boolean;
  isSetupCompleted: boolean;
  setupProgress: TenantSetupProgressDTO | null;
  
  // Loading states
  isCheckingTenant: boolean;
  isInitiatingSetup: boolean;
  
  // Error states  
  error: string | null;
  
  // Organization info from JWT
  organizationId: string | null;
  organizationName: string | null;
}

export interface TenantSetupActions {
  initiateSetup: (setupRequest?: Partial<TenantSetupRequestDTO>) => Promise<void>;
  retrySetup: () => Promise<void>;
  clearError: () => void;
  refreshTenantInfo: () => Promise<void>;
}

export interface UseTenantSetupResult {
  state: TenantSetupState;
  actions: TenantSetupActions;
}

/**
 * Hook for managing tenant setup process
 * Handles tenant existence check, setup initiation, and progress tracking
 */
export function useTenantSetup(): UseTenantSetupResult {
  const { data: session, status: sessionStatus } = useSession();
  
  // Local state
  const [state, setState] = useState<TenantSetupState>({
    tenantInfo: null,
    isSetupRequired: false,
    isSetupInProgress: false,
    isSetupCompleted: false,
    setupProgress: null,
    isCheckingTenant: false,
    isInitiatingSetup: false,
    error: null,
    organizationId: null,
    organizationName: null,
  });

  // Extract organization info from session
  const organization = session?.user?.organizations?.[0];
  const organizationId = organization?.id || null;
  const organizationName = organization?.name || null;

  // API hooks
  const tenantInfoQuery = useGetTenantInfo({
    query: {
      enabled: !!organizationId && sessionStatus === 'authenticated',
      refetchOnWindowFocus: false,
      retry: 1,
    }
  });

  const setupProgressQuery = useGetSetupProgress({
    query: {
      enabled: state.isSetupInProgress,
      refetchInterval: state.isSetupInProgress ? 2000 : false, // Poll every 2 seconds during setup
      refetchOnWindowFocus: false,
    }
  });

  const initiateSetupMutation = useInitiateSetup({
    mutation: {
      onSuccess: (response) => {
        setState(prev => ({
          ...prev,
          isInitiatingSetup: false,
          isSetupInProgress: true,
          setupProgress: response,
          error: null,
        }));
      },
      onError: (error) => {
        setState(prev => ({
          ...prev,
          isInitiatingSetup: false,
          isSetupInProgress: false,
          error: error instanceof Error ? error.message : 'Failed to initiate tenant setup',
        }));
      },
    }
  });

  // Update state when tenant info changes
  useEffect(() => {
    if (tenantInfoQuery.data) {
      const tenantInfo = tenantInfoQuery.data;
      const setupRequired = tenantInfo.setupRequired || !tenantInfo.setupCompleted;
      
      setState(prev => ({
        ...prev,
        tenantInfo,
        isSetupRequired: setupRequired,
        isSetupCompleted: tenantInfo.setupCompleted || false,
        isCheckingTenant: false,
        error: tenantInfoQuery.error ? 'Failed to fetch tenant information' : null,
      }));
    } else if (tenantInfoQuery.error) {
      // If tenant doesn't exist, setup is required
      setState(prev => ({
        ...prev,
        tenantInfo: null,
        isSetupRequired: true,
        isSetupCompleted: false,
        isCheckingTenant: false,
        error: null, // Don't show error for non-existent tenant
      }));
    }
  }, [tenantInfoQuery.data, tenantInfoQuery.error]);

  // Update state when setup progress changes
  useEffect(() => {
    if (setupProgressQuery.data) {
      const progress = setupProgressQuery.data;
      
      setState(prev => ({
        ...prev,
        setupProgress: progress,
        isSetupInProgress: progress.status === TenantSetupProgressDTOStatus.IN_PROGRESS,
        isSetupCompleted: progress.status === TenantSetupProgressDTOStatus.COMPLETED,
        isSetupRequired: progress.status !== TenantSetupProgressDTOStatus.COMPLETED,
        error: progress.status === TenantSetupProgressDTOStatus.FAILED ? 
          progress.errorMessage || 'Tenant setup failed' : null,
      }));

      // If setup completed, refresh tenant info
      if (progress.status === TenantSetupProgressDTOStatus.COMPLETED) {
        tenantInfoQuery.refetch();
      }
    }
  }, [setupProgressQuery.data]);

  // Update organization info in state
  useEffect(() => {
    setState(prev => ({
      ...prev,
      organizationId,
      organizationName,
      isCheckingTenant: !!organizationId && tenantInfoQuery.isLoading,
    }));
  }, [organizationId, organizationName, tenantInfoQuery.isLoading]);

  // Actions
  const initiateSetup = useCallback(async (setupRequest?: Partial<TenantSetupRequestDTO>) => {
    if (!organizationName) {
      setState(prev => ({ ...prev, error: 'No organization found in session' }));
      return;
    }

    setState(prev => ({ ...prev, isInitiatingSetup: true, error: null }));

    // Prepare setup request with defaults for India
    const request: TenantSetupRequestDTO = {
      tenantName: organizationName,
      timezone: 'Asia/Kolkata',
      currency: 'INR', 
      language: 'en',
      createSampleData: false, // Generally false for production in India
      industry: undefined, // Will be set by user in form
      ...setupRequest, // Override with any provided values
    };

    try {
      await initiateSetupMutation.mutateAsync({ data: request });
    } catch (error) {
      // Error handling is done in mutation callbacks
      console.error('Failed to initiate setup:', error);
    }
  }, [organizationName, initiateSetupMutation]);

  const retrySetup = useCallback(async () => {
    await initiateSetup();
  }, [initiateSetup]);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const refreshTenantInfo = useCallback(async () => {
    await tenantInfoQuery.refetch();
  }, [tenantInfoQuery]);

  return {
    state,
    actions: {
      initiateSetup,
      retrySetup,
      clearError,
      refreshTenantInfo,
    },
  };
}

/**
 * Utility function to determine if tenant setup is needed
 */
export function isTenantSetupNeeded(tenantInfo: TenantInfoDTO | null): boolean {
  if (!tenantInfo) return true;
  return tenantInfo.setupRequired || !tenantInfo.setupCompleted;
}

/**
 * Utility function to get setup progress percentage
 */
export function getSetupProgressPercentage(progress: TenantSetupProgressDTO | null): number {
  if (!progress) return 0;
  return progress.progressPercentage || 0;
}

/**
 * Utility function to get human-readable setup step name
 */
export function getSetupStepName(step: string | undefined): string {
  const stepNames: Record<string, string> = {
    'VALIDATION': 'Validating Configuration',
    'SCHEMA_CREATION': 'Creating Database Schema', 
    'MIGRATIONS': 'Running Database Migrations',
    'BOOTSTRAP_DATA': 'Setting up Default Data',
    'FINALIZATION': 'Finalizing Setup',
    'COMPLETED': 'Setup Complete',
  };
  
  return stepNames[step || ''] || 'Preparing Setup';
}
