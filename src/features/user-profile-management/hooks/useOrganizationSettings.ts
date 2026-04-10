'use client';

import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import {
  getOrganizationSettings,
  type OrganizationSettings,
  removeOrganizationLogo,
  uploadOrganizationLogo,
  updateOrganizationSettings,
} from '../services/organization-settings.service';

interface UseOrganizationSettingsState {
  organizationSettings: OrganizationSettings | null;
  isLoading: boolean;
  isUpdating: boolean;
  isUploadingLogo: boolean;
  isRemovingLogo: boolean;
  error: string | null;
}

interface UseOrganizationSettingsActions {
  refreshOrganizationSettings: () => Promise<void>;
  saveOrganizationSettings: (data: OrganizationSettings) => Promise<boolean>;
  uploadLogo: (file: File) => Promise<OrganizationSettings | null>;
  removeLogo: () => Promise<OrganizationSettings | null>;
  clearError: () => void;
}

export type UseOrganizationSettingsReturn = UseOrganizationSettingsState &
  UseOrganizationSettingsActions;

export function useOrganizationSettings(): UseOrganizationSettingsReturn {
  const [state, setState] = useState<UseOrganizationSettingsState>({
    organizationSettings: null,
    isLoading: false,
    isUpdating: false,
    isUploadingLogo: false,
    isRemovingLogo: false,
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

  const uploadLogo = useCallback(async (file: File): Promise<OrganizationSettings | null> => {
    setState((prev) => ({ ...prev, isUploadingLogo: true, error: null }));

    try {
      const updatedSettings = await uploadOrganizationLogo(file);

      setState((prev) => ({
        ...prev,
        organizationSettings: updatedSettings,
        isUploadingLogo: false,
      }));
      toast.success('Organization logo updated successfully');

      return updatedSettings;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to update organization logo';

      setState((prev) => ({
        ...prev,
        isUploadingLogo: false,
        error: errorMessage,
      }));
      toast.error(errorMessage);

      return null;
    }
  }, []);

  const removeLogo = useCallback(async (): Promise<OrganizationSettings | null> => {
    setState((prev) => ({ ...prev, isRemovingLogo: true, error: null }));

    try {
      const updatedSettings = await removeOrganizationLogo();

      setState((prev) => ({
        ...prev,
        organizationSettings: updatedSettings,
        isRemovingLogo: false,
      }));
      toast.success('Organization logo removed successfully');

      return updatedSettings;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to remove organization logo';

      setState((prev) => ({
        ...prev,
        isRemovingLogo: false,
        error: errorMessage,
      }));
      toast.error(errorMessage);

      return null;
    }
  }, []);

  return {
    ...state,
    refreshOrganizationSettings,
    saveOrganizationSettings,
    uploadLogo,
    removeLogo,
    clearError,
  };
}
