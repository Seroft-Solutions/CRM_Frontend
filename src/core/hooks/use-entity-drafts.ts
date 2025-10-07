'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  useCreateUserDraft,
  useUpdateUserDraft,
  useDeleteUserDraft,
  useGetAllUserDrafts,
  type UserDraftDTO,
} from '@/core/api/generated/spring/endpoints/user-draft-resource/user-draft-resource.gen';

export interface DraftData {
  entityType: string;
  formData: Record<string, any>;
  currentStep?: number;
  sessionId?: string;
  savedAt: string;
  version: string;
}

export interface UseDraftsOptions {
  entityType: string;
  enabled?: boolean;
  maxDrafts?: number;
}

export interface DraftItem {
  id: number;
  data: DraftData;
  rawData: any; // Original draft object from API
  createdDate?: string;
  lastModifiedDate?: string;
}

/**
 * Hook for managing entity form drafts
 * Provides functionality to save, load, and manage drafts for any entity type
 */
export function useEntityDrafts({ entityType, enabled = true, maxDrafts = 5 }: UseDraftsOptions) {
  const queryClient = useQueryClient();

  // Get all drafts for this entity type
  const {
    data: draftsResponse,
    isLoading: isLoadingDrafts,
    error: draftsError,
  } = useGetAllUserDrafts(
    {
      'type.equals': entityType,
    },
    {
      query: {
        enabled: enabled,
        staleTime: 1000 * 60 * 5, // 5 minutes
        refetchOnWindowFocus: false,
      },
    }
  );

  // Transform response to DraftItem[]
  const drafts: DraftItem[] = draftsResponse
    ? draftsResponse.map((draft) => ({
        id: draft.id!,
        data: JSON.parse(draft.jsonPayload) as DraftData,
        rawData: draft, // Store original draft object
        createdDate: draft.createdDate,
        lastModifiedDate: draft.lastModifiedDate,
      }))
    : [];

  // Create draft mutation
  const createDraftMutation = useCreateUserDraft({
    mutation: {
      onSuccess: (data) => {
        queryClient.invalidateQueries({
          queryKey: ['/api/user-drafts'],
        });
        // Removed toast from here - let the caller handle success messages
      },
      onError: (error) => {
        console.error('Failed to create draft:', error);
        // Removed toast from here - let the caller handle error messages
      },
    },
  });

  // Update draft mutation
  const updateDraftMutation = useUpdateUserDraft({
    mutation: {
      onSuccess: (data) => {
        queryClient.invalidateQueries({
          queryKey: ['/api/user-drafts'],
        });
        // Removed toast from here - let the caller handle success messages
      },
      onError: (error) => {
        console.error('Failed to update draft:', error);
        // Removed toast from here - let the caller handle error messages
      },
    },
  });

  // Delete draft mutation
  const deleteDraftMutation = useDeleteUserDraft({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: ['/api/user-drafts'],
        });
        // Removed toast from here - let the caller handle success messages
      },
      onError: (error: any) => {
        console.error('Failed to delete draft:', error);
        // Removed toast from here - let the caller handle error messages
      },
    },
  });

  /**
   * Save form data as a draft
   */
  const saveDraft = async (
    formData: Record<string, any>,
    currentStep?: number,
    sessionId?: string,
    existingDraftId?: number
  ): Promise<boolean> => {
    if (!enabled) return false;

    try {
      const draftData: DraftData = {
        entityType,
        formData,
        currentStep: currentStep || 0,
        sessionId: sessionId || `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        savedAt: new Date().toISOString(),
        version: '1.0',
      };

      const userDraftDTO: UserDraftDTO = {
        type: entityType,
        status: 'ACTIVE',
        jsonPayload: JSON.stringify(draftData),
      };

      if (existingDraftId) {
        await updateDraftMutation.mutateAsync({
          id: existingDraftId,
          data: userDraftDTO,
        });
      } else {
        // Check if we need to clean up old drafts before creating new one
        if (drafts.length >= maxDrafts) {
          const oldestDraft = drafts.sort(
            (a, b) =>
              new Date(a.createdDate || '').getTime() - new Date(b.createdDate || '').getTime()
          )[0];

          if (oldestDraft) {
            await deleteDraftMutation.mutateAsync({ id: oldestDraft.id });
          }
        }

        await createDraftMutation.mutateAsync({
          data: userDraftDTO,
        });
      }

      return true;
    } catch (error) {
      console.error('Failed to save draft:', error);
      return false;
    }
  };

  /**
   * Load a specific draft by ID
   */
  const loadDraft = (draftId: number): DraftData | null => {
    const draft = drafts.find((d) => d.id === draftId);
    return draft ? draft.data : null;
  };

  /**
   * Restore a draft (load and then attempt to archive it)
   * Returns the draft data immediately, then attempts archiving in background
   */
  const restoreDraft = async (draftId: number): Promise<DraftData | null> => {
    const draft = drafts.find((d) => d.id === draftId);
    if (!draft) return null;

    // Return the data immediately - restoration should always succeed if we have local data
    const draftData = draft.data;

    // Attempt to archive the draft in background - don't let failure affect restoration
    setTimeout(async () => {
      try {
        const draftToArchive = draft.rawData;
        await updateDraftMutation.mutateAsync({
          id: draftId,
          data: {
            ...draftToArchive,
            status: 'ARCHIVED',
          },
        });
      } catch (error: any) {
        // Handle 409 conflicts gracefully - draft was already modified elsewhere
        if (error?.response?.status === 409 || error?.status === 409) {
          console.log(`Draft ${draftId} was already modified, updating local state`);
          // Refresh the drafts list to sync with server state
          queryClient.invalidateQueries({
            queryKey: ['/api/user-drafts'],
          });
        } else {
          console.warn(`Failed to archive draft ${draftId} after restoration:`, error);
        }
      }
    }, 100);

    return draftData;
  };

  /**
   * Delete a specific draft
   */
  const deleteDraft = async (draftId: number): Promise<boolean> => {
    try {
      await deleteDraftMutation.mutateAsync({ id: draftId });
      return true;
    } catch (error: any) {
      // Handle 409 conflicts gracefully - draft was already deleted elsewhere
      if (error?.response?.status === 409 || error?.status === 409) {
        console.log(`Draft ${draftId} was already deleted, updating local state`);
        // Refresh the drafts list to sync with server state
        queryClient.invalidateQueries({
          queryKey: ['/api/user-drafts'],
        });
        return true; // Treat as success since the draft is gone anyway
      } else {
        console.error('Failed to delete draft:', error);
        return false;
      }
    }
  };

  /**
   * Get the most recent draft
   */
  const getLatestDraft = (): DraftItem | null => {
    if (drafts.length === 0) return null;

    return drafts.sort(
      (a, b) =>
        new Date(b.lastModifiedDate || b.createdDate || '').getTime() -
        new Date(a.lastModifiedDate || a.createdDate || '').getTime()
    )[0];
  };

  /**
   * Clean up old drafts based on age or count
   */
  const cleanupOldDrafts = async (olderThanDays = 30): Promise<void> => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const oldDrafts = drafts.filter((draft) => {
      const draftDate = new Date(draft.createdDate || '');
      return draftDate < cutoffDate;
    });

    for (const draft of oldDrafts) {
      await deleteDraft(draft.id);
    }
  };

  return {
    // Data
    drafts,
    hasLoadingDrafts: isLoadingDrafts,
    draftsError,

    // Actions
    saveDraft,
    loadDraft,
    restoreDraft,
    deleteDraft,
    getLatestDraft,
    cleanupOldDrafts,

    // State
    isSaving: createDraftMutation.isPending || updateDraftMutation.isPending,
    isDeleting: deleteDraftMutation.isPending,
  };
}
