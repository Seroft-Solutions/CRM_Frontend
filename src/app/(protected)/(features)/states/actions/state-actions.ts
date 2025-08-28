// ===============================================================
// 🛑 AUTO-GENERATED FILE – DO NOT EDIT DIRECTLY 🛑
// - Source: code generation pipeline
// - To customize: use ./overrides/[filename].ts or feature-level
//   extensions (e.g., ./src/features/.../extensions/)
// - Direct edits will be overwritten on regeneration
// ===============================================================
'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
// Import the generated API functions directly
import {
  createState,
  updateState,
} from '@/core/api/generated/spring/endpoints/state-resource/state-resource.gen';
import { StateDTOStatus } from '@/core/api/generated/spring/schemas/StateDTOStatus';
import { stateToast } from '../components/state-toast';

export async function createStateAction(data: any) {
  try {
    // Create entity using the generated API function
    const result = await createState(data);

    // Revalidate both the main list page and any related pages
    revalidatePath('/states');
    revalidatePath('/states/new');
    stateToast.created();

    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to create state:', error);
    stateToast.createError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function updateStateAction(id: number, data: any) {
  try {
    // Update entity using the generated API function with correct signature
    const result = await updateState(id, data);

    // Revalidate all related paths to ensure fresh data
    revalidatePath('/states');
    revalidatePath(`/states/${id}`);
    revalidatePath(`/states/${id}/edit`);
    stateToast.updated();

    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to update state:', error);
    stateToast.updateError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function archiveStateAction(id: number, entityData: any) {
  try {
    const archivedEntity = {
      ...entityData,
      status: StateDTOStatus.ARCHIVED,
    };

    const result = await updateState(id, archivedEntity);

    revalidatePath('/states');
    stateToast.custom.success('Archived Successfully', 'State has been archived');

    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to archive state:', error);
    stateToast.custom.error('Archive Failed', error?.message || 'Could not archive state');
    return { success: false, error: error?.message };
  }
}

export async function updateStatusStateAction(id: number, entityData: any, newStatus: string) {
  try {
    const statusValue = StateDTOStatus[newStatus as keyof typeof StateDTOStatus];
    const updatedEntity = {
      ...entityData,
      status: statusValue,
    };

    const result = await updateState(id, updatedEntity);

    revalidatePath('/states');
    stateToast.custom.success(
      'Status Updated',
      `State status changed to ${newStatus.toLowerCase()}`
    );

    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to update state status:', error);
    stateToast.custom.error(
      'Status Update Failed',
      error?.message || 'Could not update state status'
    );
    return { success: false, error: error?.message };
  }
}

export async function bulkArchiveStateAction(ids: number[], entitiesData: any[]) {
  try {
    const results = await Promise.allSettled(
      ids.map(async (id, index) => {
        const entityData = entitiesData[index];
        const archivedEntity = {
          ...entityData,
          status: StateDTOStatus.ARCHIVED,
        };
        return updateState(id, archivedEntity);
      })
    );

    const successCount = results.filter((r) => r.status === 'fulfilled').length;
    const errorCount = results.filter((r) => r.status === 'rejected').length;

    // Revalidate to ensure table reflects changes
    revalidatePath('/states');

    if (errorCount === 0) {
      stateToast.custom.success(
        'Bulk Archive Complete',
        `${successCount} item${successCount > 1 ? 's' : ''} archived successfully`
      );
    } else {
      stateToast.custom.warning(
        'Partial Archive',
        `${successCount} archived, ${errorCount} failed`
      );
    }

    return { success: errorCount === 0, successCount, errorCount };
  } catch (error) {
    console.error('Bulk archive failed:', error);
    stateToast.custom.error('Bulk Archive Failed', error?.message || 'Could not archive items');
    return { success: false, error: error?.message };
  }
}

export async function bulkUpdateStatusStateAction(
  ids: number[],
  entitiesData: any[],
  newStatus: string
) {
  try {
    const statusValue = StateDTOStatus[newStatus as keyof typeof StateDTOStatus];
    const results = await Promise.allSettled(
      ids.map(async (id, index) => {
        const entityData = entitiesData[index];
        const updatedEntity = {
          ...entityData,
          status: statusValue,
        };
        return updateState(id, updatedEntity);
      })
    );

    const successCount = results.filter((r) => r.status === 'fulfilled').length;
    const errorCount = results.filter((r) => r.status === 'rejected').length;

    // Revalidate to ensure table reflects changes
    revalidatePath('/states');

    if (errorCount === 0) {
      stateToast.custom.success(
        'Bulk Status Update Complete',
        `${successCount} item${successCount > 1 ? 's' : ''} updated to ${newStatus.toLowerCase()}`
      );
    } else {
      stateToast.custom.warning(
        'Partial Status Update',
        `${successCount} updated, ${errorCount} failed`
      );
    }

    return { success: errorCount === 0, successCount, errorCount };
  } catch (error) {
    console.error('Bulk status update failed:', error);
    stateToast.custom.error(
      'Bulk Status Update Failed',
      error?.message || 'Could not update status for items'
    );
    return { success: false, error: error?.message };
  }
}
