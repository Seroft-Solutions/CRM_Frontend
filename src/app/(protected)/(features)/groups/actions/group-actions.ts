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
  createGroup,
  updateGroup,
} from '@/core/api/generated/spring/endpoints/group-resource/group-resource.gen';
import { GroupDTOStatus } from '@/core/api/generated/spring/schemas/GroupDTOStatus';
import { groupToast } from '../components/group-toast';

export async function createGroupAction(data: any) {
  try {
    // Create entity using the generated API function
    const result = await createGroup(data);

    // Revalidate both the main list page and any related pages
    revalidatePath('/groups');
    revalidatePath('/groups/new');
    groupToast.created();

    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to create group:', error);
    groupToast.createError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function updateGroupAction(id: number, data: any) {
  try {
    // Update entity using the generated API function with correct signature
    const result = await updateGroup(id, data);

    // Revalidate all related paths to ensure fresh data
    revalidatePath('/groups');
    revalidatePath(`/groups/${id}`);
    revalidatePath(`/groups/${id}/edit`);
    groupToast.updated();

    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to update group:', error);
    groupToast.updateError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function archiveGroupAction(id: number, entityData: any) {
  try {
    const archivedEntity = {
      ...entityData,
      status: GroupDTOStatus.ARCHIVED,
    };

    const result = await updateGroup(id, archivedEntity);

    revalidatePath('/groups');
    groupToast.custom.success('Archived Successfully', 'Group has been archived');

    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to archive group:', error);
    groupToast.custom.error('Archive Failed', error?.message || 'Could not archive group');
    return { success: false, error: error?.message };
  }
}

export async function updateStatusGroupAction(id: number, entityData: any, newStatus: string) {
  try {
    const statusValue = GroupDTOStatus[newStatus as keyof typeof GroupDTOStatus];
    const updatedEntity = {
      ...entityData,
      status: statusValue,
    };

    const result = await updateGroup(id, updatedEntity);

    revalidatePath('/groups');
    groupToast.custom.success(
      'Status Updated',
      `Group status changed to ${newStatus.toLowerCase()}`
    );

    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to update group status:', error);
    groupToast.custom.error(
      'Status Update Failed',
      error?.message || 'Could not update group status'
    );
    return { success: false, error: error?.message };
  }
}

export async function bulkArchiveGroupAction(ids: number[], entitiesData: any[]) {
  try {
    const results = await Promise.allSettled(
      ids.map(async (id, index) => {
        const entityData = entitiesData[index];
        const archivedEntity = {
          ...entityData,
          status: GroupDTOStatus.ARCHIVED,
        };
        return updateGroup(id, archivedEntity);
      })
    );

    const successCount = results.filter((r) => r.status === 'fulfilled').length;
    const errorCount = results.filter((r) => r.status === 'rejected').length;

    // Revalidate to ensure table reflects changes
    revalidatePath('/groups');

    if (errorCount === 0) {
      groupToast.custom.success(
        'Bulk Archive Complete',
        `${successCount} item${successCount > 1 ? 's' : ''} archived successfully`
      );
    } else {
      groupToast.custom.warning(
        'Partial Archive',
        `${successCount} archived, ${errorCount} failed`
      );
    }

    return { success: errorCount === 0, successCount, errorCount };
  } catch (error) {
    console.error('Bulk archive failed:', error);
    groupToast.custom.error('Bulk Archive Failed', error?.message || 'Could not archive items');
    return { success: false, error: error?.message };
  }
}

export async function bulkUpdateStatusGroupAction(
  ids: number[],
  entitiesData: any[],
  newStatus: string
) {
  try {
    const statusValue = GroupDTOStatus[newStatus as keyof typeof GroupDTOStatus];
    const results = await Promise.allSettled(
      ids.map(async (id, index) => {
        const entityData = entitiesData[index];
        const updatedEntity = {
          ...entityData,
          status: statusValue,
        };
        return updateGroup(id, updatedEntity);
      })
    );

    const successCount = results.filter((r) => r.status === 'fulfilled').length;
    const errorCount = results.filter((r) => r.status === 'rejected').length;

    // Revalidate to ensure table reflects changes
    revalidatePath('/groups');

    if (errorCount === 0) {
      groupToast.custom.success(
        'Bulk Status Update Complete',
        `${successCount} item${successCount > 1 ? 's' : ''} updated to ${newStatus.toLowerCase()}`
      );
    } else {
      groupToast.custom.warning(
        'Partial Status Update',
        `${successCount} updated, ${errorCount} failed`
      );
    }

    return { success: errorCount === 0, successCount, errorCount };
  } catch (error) {
    console.error('Bulk status update failed:', error);
    groupToast.custom.error(
      'Bulk Status Update Failed',
      error?.message || 'Could not update status for items'
    );
    return { success: false, error: error?.message };
  }
}
