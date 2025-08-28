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
  createUserAvailability,
  updateUserAvailability,
} from '@/core/api/generated/spring/endpoints/user-availability-resource/user-availability-resource.gen';
import { UserAvailabilityDTOStatus } from '@/core/api/generated/spring/schemas/UserAvailabilityDTOStatus';
import { userAvailabilityToast } from '../components/user-availability-toast';

export async function createUserAvailabilityAction(data: any) {
  try {
    // Create entity using the generated API function
    const result = await createUserAvailability(data);

    // Revalidate both the main list page and any related pages
    revalidatePath('/user-availabilities');
    revalidatePath('/user-availabilities/new');
    userAvailabilityToast.created();

    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to create useravailability:', error);
    userAvailabilityToast.createError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function updateUserAvailabilityAction(id: number, data: any) {
  try {
    // Update entity using the generated API function with correct signature
    const result = await updateUserAvailability(id, data);

    // Revalidate all related paths to ensure fresh data
    revalidatePath('/user-availabilities');
    revalidatePath(`/user-availabilities/${id}`);
    revalidatePath(`/user-availabilities/${id}/edit`);
    userAvailabilityToast.updated();

    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to update useravailability:', error);
    userAvailabilityToast.updateError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function archiveUserAvailabilityAction(id: number, entityData: any) {
  try {
    const archivedEntity = {
      ...entityData,
      status: UserAvailabilityDTOStatus.ARCHIVED,
    };

    const result = await updateUserAvailability(id, archivedEntity);

    revalidatePath('/user-availabilities');
    userAvailabilityToast.custom.success(
      'Archived Successfully',
      'UserAvailability has been archived'
    );

    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to archive useravailability:', error);
    userAvailabilityToast.custom.error(
      'Archive Failed',
      error?.message || 'Could not archive useravailability'
    );
    return { success: false, error: error?.message };
  }
}

export async function updateStatusUserAvailabilityAction(
  id: number,
  entityData: any,
  newStatus: string
) {
  try {
    const statusValue =
      UserAvailabilityDTOStatus[newStatus as keyof typeof UserAvailabilityDTOStatus];
    const updatedEntity = {
      ...entityData,
      status: statusValue,
    };

    const result = await updateUserAvailability(id, updatedEntity);

    revalidatePath('/user-availabilities');
    userAvailabilityToast.custom.success(
      'Status Updated',
      `UserAvailability status changed to ${newStatus.toLowerCase()}`
    );

    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to update useravailability status:', error);
    userAvailabilityToast.custom.error(
      'Status Update Failed',
      error?.message || 'Could not update useravailability status'
    );
    return { success: false, error: error?.message };
  }
}

export async function bulkArchiveUserAvailabilityAction(ids: number[], entitiesData: any[]) {
  try {
    const results = await Promise.allSettled(
      ids.map(async (id, index) => {
        const entityData = entitiesData[index];
        const archivedEntity = {
          ...entityData,
          status: UserAvailabilityDTOStatus.ARCHIVED,
        };
        return updateUserAvailability(id, archivedEntity);
      })
    );

    const successCount = results.filter((r) => r.status === 'fulfilled').length;
    const errorCount = results.filter((r) => r.status === 'rejected').length;

    // Revalidate to ensure table reflects changes
    revalidatePath('/user-availabilities');

    if (errorCount === 0) {
      userAvailabilityToast.custom.success(
        'Bulk Archive Complete',
        `${successCount} item${successCount > 1 ? 's' : ''} archived successfully`
      );
    } else {
      userAvailabilityToast.custom.warning(
        'Partial Archive',
        `${successCount} archived, ${errorCount} failed`
      );
    }

    return { success: errorCount === 0, successCount, errorCount };
  } catch (error) {
    console.error('Bulk archive failed:', error);
    userAvailabilityToast.custom.error(
      'Bulk Archive Failed',
      error?.message || 'Could not archive items'
    );
    return { success: false, error: error?.message };
  }
}

export async function bulkUpdateStatusUserAvailabilityAction(
  ids: number[],
  entitiesData: any[],
  newStatus: string
) {
  try {
    const statusValue =
      UserAvailabilityDTOStatus[newStatus as keyof typeof UserAvailabilityDTOStatus];
    const results = await Promise.allSettled(
      ids.map(async (id, index) => {
        const entityData = entitiesData[index];
        const updatedEntity = {
          ...entityData,
          status: statusValue,
        };
        return updateUserAvailability(id, updatedEntity);
      })
    );

    const successCount = results.filter((r) => r.status === 'fulfilled').length;
    const errorCount = results.filter((r) => r.status === 'rejected').length;

    // Revalidate to ensure table reflects changes
    revalidatePath('/user-availabilities');

    if (errorCount === 0) {
      userAvailabilityToast.custom.success(
        'Bulk Status Update Complete',
        `${successCount} item${successCount > 1 ? 's' : ''} updated to ${newStatus.toLowerCase()}`
      );
    } else {
      userAvailabilityToast.custom.warning(
        'Partial Status Update',
        `${successCount} updated, ${errorCount} failed`
      );
    }

    return { success: errorCount === 0, successCount, errorCount };
  } catch (error) {
    console.error('Bulk status update failed:', error);
    userAvailabilityToast.custom.error(
      'Bulk Status Update Failed',
      error?.message || 'Could not update status for items'
    );
    return { success: false, error: error?.message };
  }
}
