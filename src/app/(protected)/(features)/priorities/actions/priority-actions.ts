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
  createPriority,
  updatePriority,
} from '@/core/api/generated/spring/endpoints/priority-resource/priority-resource.gen';
import { PriorityDTOStatus } from '@/core/api/generated/spring/schemas/PriorityDTOStatus';
import { priorityToast } from '../components/priority-toast';

export async function createPriorityAction(data: any) {
  try {
    // Create entity using the generated API function
    const result = await createPriority(data);

    // Revalidate both the main list page and any related pages
    revalidatePath('/priorities');
    revalidatePath('/priorities/new');
    priorityToast.created();

    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to create priority:', error);
    priorityToast.createError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function updatePriorityAction(id: number, data: any) {
  try {
    // Update entity using the generated API function with correct signature
    const result = await updatePriority(id, data);

    // Revalidate all related paths to ensure fresh data
    revalidatePath('/priorities');
    revalidatePath(`/priorities/${id}`);
    revalidatePath(`/priorities/${id}/edit`);
    priorityToast.updated();

    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to update priority:', error);
    priorityToast.updateError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function archivePriorityAction(id: number, entityData: any) {
  try {
    const archivedEntity = {
      ...entityData,
      status: PriorityDTOStatus.ARCHIVED,
    };

    const result = await updatePriority(id, archivedEntity);

    revalidatePath('/priorities');
    priorityToast.custom.success('Archived Successfully', 'Priority has been archived');

    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to archive priority:', error);
    priorityToast.custom.error('Archive Failed', error?.message || 'Could not archive priority');
    return { success: false, error: error?.message };
  }
}

export async function updateStatusPriorityAction(id: number, entityData: any, newStatus: string) {
  try {
    const statusValue = PriorityDTOStatus[newStatus as keyof typeof PriorityDTOStatus];
    const updatedEntity = {
      ...entityData,
      status: statusValue,
    };

    const result = await updatePriority(id, updatedEntity);

    revalidatePath('/priorities');
    priorityToast.custom.success(
      'Status Updated',
      `Priority status changed to ${newStatus.toLowerCase()}`
    );

    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to update priority status:', error);
    priorityToast.custom.error(
      'Status Update Failed',
      error?.message || 'Could not update priority status'
    );
    return { success: false, error: error?.message };
  }
}

export async function bulkArchivePriorityAction(ids: number[], entitiesData: any[]) {
  try {
    const results = await Promise.allSettled(
      ids.map(async (id, index) => {
        const entityData = entitiesData[index];
        const archivedEntity = {
          ...entityData,
          status: PriorityDTOStatus.ARCHIVED,
        };
        return updatePriority(id, archivedEntity);
      })
    );

    const successCount = results.filter((r) => r.status === 'fulfilled').length;
    const errorCount = results.filter((r) => r.status === 'rejected').length;

    // Revalidate to ensure table reflects changes
    revalidatePath('/priorities');

    if (errorCount === 0) {
      priorityToast.custom.success(
        'Bulk Archive Complete',
        `${successCount} item${successCount > 1 ? 's' : ''} archived successfully`
      );
    } else {
      priorityToast.custom.warning(
        'Partial Archive',
        `${successCount} archived, ${errorCount} failed`
      );
    }

    return { success: errorCount === 0, successCount, errorCount };
  } catch (error) {
    console.error('Bulk archive failed:', error);
    priorityToast.custom.error('Bulk Archive Failed', error?.message || 'Could not archive items');
    return { success: false, error: error?.message };
  }
}

export async function bulkUpdateStatusPriorityAction(
  ids: number[],
  entitiesData: any[],
  newStatus: string
) {
  try {
    const statusValue = PriorityDTOStatus[newStatus as keyof typeof PriorityDTOStatus];
    const results = await Promise.allSettled(
      ids.map(async (id, index) => {
        const entityData = entitiesData[index];
        const updatedEntity = {
          ...entityData,
          status: statusValue,
        };
        return updatePriority(id, updatedEntity);
      })
    );

    const successCount = results.filter((r) => r.status === 'fulfilled').length;
    const errorCount = results.filter((r) => r.status === 'rejected').length;

    // Revalidate to ensure table reflects changes
    revalidatePath('/priorities');

    if (errorCount === 0) {
      priorityToast.custom.success(
        'Bulk Status Update Complete',
        `${successCount} item${successCount > 1 ? 's' : ''} updated to ${newStatus.toLowerCase()}`
      );
    } else {
      priorityToast.custom.warning(
        'Partial Status Update',
        `${successCount} updated, ${errorCount} failed`
      );
    }

    return { success: errorCount === 0, successCount, errorCount };
  } catch (error) {
    console.error('Bulk status update failed:', error);
    priorityToast.custom.error(
      'Bulk Status Update Failed',
      error?.message || 'Could not update status for items'
    );
    return { success: false, error: error?.message };
  }
}
