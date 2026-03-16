'use client';

import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import {
  getOrganizationSettings,
  type OrganizationSettings,
  updateOrganizationSettings,
} from '../services/organization-settings.service';

interface UseOrganizationSettingsState {
  organizationSettings: OrganizationSettings | null;
  isLoading: boolean;
  isUpdating: boolean;
  error: string | null;
}

interface UseOrganizationSettingsActions {
  refreshOrganizationSettings: () => Promise<void>;
  saveOrganizationSettings: (data: OrganizationSettings) => Promise<boolean>;
  clearError: () => void;
}

export type UseOrganizationSettingsReturn = UseOrganizationSettingsState &
  UseOrganizationSettingsActions;

export function useOrganizationSettings(): UseOrganizationSettingsReturn {
  const [state, setState] = useState<UseOrganizationSettingsState>({
    organizationSettings: null,
    isLoading: false,
    isUpdating: false,
    error: null,
  });

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  const refreshOrganizationSettings = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const organizationSettings = await getOrganizationSettings();

      setState((prev) => ({
        ...prev,
        organizationSettings,
        isLoading: false,
      }));
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to load organization settings';

      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
    }
  }, []);

  const saveOrganizationSettings = useCallback(async (data: OrganizationSettings) => {
    setState((prev) => ({ ...prev, isUpdating: true, error: null }));

    try {
      const updatedSettings = await updateOrganizationSettings(data);

      setState((prev) => ({
        ...prev,
        organizationSettings: updatedSettings,
        isUpdating: false,
      }));
      toast.success('Organization settings updated successfully');

      return true;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to update organization settings';

      setState((prev) => ({
        ...prev,
        isUpdating: false,
        error: errorMessage,
      }));
      toast.error(errorMessage);

      return false;
    }
  }, []);

  return {
    ...state,
    refreshOrganizationSettings,
    saveOrganizationSettings,
    clearError,
  };
}
