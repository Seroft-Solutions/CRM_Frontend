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
  createUserDraft,
  updateUserDraft,
} from '@/core/api/generated/spring/endpoints/user-draft-resource/user-draft-resource.gen';
import { UserDraftDTOStatus } from '@/core/api/generated/spring/schemas/UserDraftDTOStatus';
import { userDraftToast } from '../components/user-draft-toast';

export async function createUserDraftAction(data: any) {
  try {
    // Create entity using the generated API function
    const result = await createUserDraft(data);

    // Revalidate both the main list page and any related pages
    revalidatePath('/user-drafts');
    revalidatePath('/user-drafts/new');
    userDraftToast.created();

    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to create userdraft:', error);
    userDraftToast.createError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function updateUserDraftAction(id: number, data: any) {
  try {
    // Update entity using the generated API function with correct signature
    const result = await updateUserDraft(id, data);

    // Revalidate all related paths to ensure fresh data
    revalidatePath('/user-drafts');
    revalidatePath(`/user-drafts/${id}`);
    revalidatePath(`/user-drafts/${id}/edit`);
    userDraftToast.updated();

    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to update userdraft:', error);
    userDraftToast.updateError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function archiveUserDraftAction(id: number, entityData: any) {
  try {
    const archivedEntity = {
      ...entityData,
      status: UserDraftDTOStatus.ARCHIVED,
    };

    const result = await updateUserDraft(id, archivedEntity);

    revalidatePath('/user-drafts');
    userDraftToast.custom.success('Archived Successfully', 'UserDraft has been archived');

    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to archive userdraft:', error);
    userDraftToast.custom.error('Archive Failed', error?.message || 'Could not archive userdraft');
    return { success: false, error: error?.message };
  }
}

export async function updateStatusUserDraftAction(id: number, entityData: any, newStatus: string) {
  try {
    const statusValue = UserDraftDTOStatus[newStatus as keyof typeof UserDraftDTOStatus];
    const updatedEntity = {
      ...entityData,
      status: statusValue,
    };

    const result = await updateUserDraft(id, updatedEntity);

    revalidatePath('/user-drafts');
    userDraftToast.custom.success(
      'Status Updated',
      `UserDraft status changed to ${newStatus.toLowerCase()}`
    );

    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to update userdraft status:', error);
    userDraftToast.custom.error(
      'Status Update Failed',
      error?.message || 'Could not update userdraft status'
    );
    return { success: false, error: error?.message };
  }
}

export async function bulkArchiveUserDraftAction(ids: number[], entitiesData: any[]) {
  try {
    const results = await Promise.allSettled(
      ids.map(async (id, index) => {
        const entityData = entitiesData[index];
        const archivedEntity = {
          ...entityData,
          status: UserDraftDTOStatus.ARCHIVED,
        };
        return updateUserDraft(id, archivedEntity);
      })
    );

    const successCount = results.filter((r) => r.status === 'fulfilled').length;
    const errorCount = results.filter((r) => r.status === 'rejected').length;

    // Revalidate to ensure table reflects changes
    revalidatePath('/user-drafts');

    if (errorCount === 0) {
      userDraftToast.custom.success(
        'Bulk Archive Complete',
        `${successCount} item${successCount > 1 ? 's' : ''} archived successfully`
      );
    } else {
      userDraftToast.custom.warning(
        'Partial Archive',
        `${successCount} archived, ${errorCount} failed`
      );
    }

    return { success: errorCount === 0, successCount, errorCount };
  } catch (error) {
    console.error('Bulk archive failed:', error);
    userDraftToast.custom.error('Bulk Archive Failed', error?.message || 'Could not archive items');
    return { success: false, error: error?.message };
  }
}

export async function bulkUpdateStatusUserDraftAction(
  ids: number[],
  entitiesData: any[],
  newStatus: string
) {
  try {
    const statusValue = UserDraftDTOStatus[newStatus as keyof typeof UserDraftDTOStatus];
    const results = await Promise.allSettled(
      ids.map(async (id, index) => {
        const entityData = entitiesData[index];
        const updatedEntity = {
          ...entityData,
          status: statusValue,
        };
        return updateUserDraft(id, updatedEntity);
      })
    );

    const successCount = results.filter((r) => r.status === 'fulfilled').length;
    const errorCount = results.filter((r) => r.status === 'rejected').length;

    // Revalidate to ensure table reflects changes
    revalidatePath('/user-drafts');

    if (errorCount === 0) {
      userDraftToast.custom.success(
        'Bulk Status Update Complete',
        `${successCount} item${successCount > 1 ? 's' : ''} updated to ${newStatus.toLowerCase()}`
      );
    } else {
      userDraftToast.custom.warning(
        'Partial Status Update',
        `${successCount} updated, ${errorCount} failed`
      );
    }

    return { success: errorCount === 0, successCount, errorCount };
  } catch (error) {
    console.error('Bulk status update failed:', error);
    userDraftToast.custom.error(
      'Bulk Status Update Failed',
      error?.message || 'Could not update status for items'
    );
    return { success: false, error: error?.message };
  }
}
