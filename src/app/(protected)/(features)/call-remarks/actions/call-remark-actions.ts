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
  createCallRemark,
  updateCallRemark,
} from '@/core/api/generated/spring/endpoints/call-remark-resource/call-remark-resource.gen';
import { CallRemarkDTOStatus } from '@/core/api/generated/spring/schemas/CallRemarkDTOStatus';
import { callRemarkToast } from '../components/call-remark-toast';

export async function createCallRemarkAction(data: any) {
  try {
    // Create entity using the generated API function
    const result = await createCallRemark(data);

    // Revalidate both the main list page and any related pages
    revalidatePath('/call-remarks');
    revalidatePath('/call-remarks/new');
    callRemarkToast.created();

    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to create callremark:', error);
    callRemarkToast.createError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function updateCallRemarkAction(id: number, data: any) {
  try {
    // Update entity using the generated API function with correct signature
    const result = await updateCallRemark(id, data);

    // Revalidate all related paths to ensure fresh data
    revalidatePath('/call-remarks');
    revalidatePath(`/call-remarks/${id}`);
    revalidatePath(`/call-remarks/${id}/edit`);
    callRemarkToast.updated();

    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to update callremark:', error);
    callRemarkToast.updateError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function archiveCallRemarkAction(id: number, entityData: any) {
  try {
    const archivedEntity = {
      ...entityData,
      status: CallRemarkDTOStatus.ARCHIVED,
    };

    const result = await updateCallRemark(id, archivedEntity);

    revalidatePath('/call-remarks');
    callRemarkToast.custom.success('Archived Successfully', 'CallRemark has been archived');

    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to archive callremark:', error);
    callRemarkToast.custom.error(
      'Archive Failed',
      error?.message || 'Could not archive callremark'
    );
    return { success: false, error: error?.message };
  }
}

export async function updateStatusCallRemarkAction(id: number, entityData: any, newStatus: string) {
  try {
    const statusValue = CallRemarkDTOStatus[newStatus as keyof typeof CallRemarkDTOStatus];
    const updatedEntity = {
      ...entityData,
      status: statusValue,
    };

    const result = await updateCallRemark(id, updatedEntity);

    revalidatePath('/call-remarks');
    callRemarkToast.custom.success(
      'Status Updated',
      `CallRemark status changed to ${newStatus.toLowerCase()}`
    );

    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to update callremark status:', error);
    callRemarkToast.custom.error(
      'Status Update Failed',
      error?.message || 'Could not update callremark status'
    );
    return { success: false, error: error?.message };
  }
}

export async function bulkArchiveCallRemarkAction(ids: number[], entitiesData: any[]) {
  try {
    const results = await Promise.allSettled(
      ids.map(async (id, index) => {
        const entityData = entitiesData[index];
        const archivedEntity = {
          ...entityData,
          status: CallRemarkDTOStatus.ARCHIVED,
        };
        return updateCallRemark(id, archivedEntity);
      })
    );

    const successCount = results.filter((r) => r.status === 'fulfilled').length;
    const errorCount = results.filter((r) => r.status === 'rejected').length;

    // Revalidate to ensure table reflects changes
    revalidatePath('/call-remarks');

    if (errorCount === 0) {
      callRemarkToast.custom.success(
        'Bulk Archive Complete',
        `${successCount} item${successCount > 1 ? 's' : ''} archived successfully`
      );
    } else {
      callRemarkToast.custom.warning(
        'Partial Archive',
        `${successCount} archived, ${errorCount} failed`
      );
    }

    return { success: errorCount === 0, successCount, errorCount };
  } catch (error) {
    console.error('Bulk archive failed:', error);
    callRemarkToast.custom.error(
      'Bulk Archive Failed',
      error?.message || 'Could not archive items'
    );
    return { success: false, error: error?.message };
  }
}

export async function bulkUpdateStatusCallRemarkAction(
  ids: number[],
  entitiesData: any[],
  newStatus: string
) {
  try {
    const statusValue = CallRemarkDTOStatus[newStatus as keyof typeof CallRemarkDTOStatus];
    const results = await Promise.allSettled(
      ids.map(async (id, index) => {
        const entityData = entitiesData[index];
        const updatedEntity = {
          ...entityData,
          status: statusValue,
        };
        return updateCallRemark(id, updatedEntity);
      })
    );

    const successCount = results.filter((r) => r.status === 'fulfilled').length;
    const errorCount = results.filter((r) => r.status === 'rejected').length;

    // Revalidate to ensure table reflects changes
    revalidatePath('/call-remarks');

    if (errorCount === 0) {
      callRemarkToast.custom.success(
        'Bulk Status Update Complete',
        `${successCount} item${successCount > 1 ? 's' : ''} updated to ${newStatus.toLowerCase()}`
      );
    } else {
      callRemarkToast.custom.warning(
        'Partial Status Update',
        `${successCount} updated, ${errorCount} failed`
      );
    }

    return { success: errorCount === 0, successCount, errorCount };
  } catch (error) {
    console.error('Bulk status update failed:', error);
    callRemarkToast.custom.error(
      'Bulk Status Update Failed',
      error?.message || 'Could not update status for items'
    );
    return { success: false, error: error?.message };
  }
}
