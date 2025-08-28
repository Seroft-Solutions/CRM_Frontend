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
  createCall,
  updateCall,
} from '@/core/api/generated/spring/endpoints/call-resource/call-resource.gen';
import { CallDTOStatus } from '@/core/api/generated/spring/schemas/CallDTOStatus';
import { callToast } from '../components/call-toast';

export async function createCallAction(data: any) {
  try {
    // Create entity using the generated API function
    const result = await createCall(data);

    // Revalidate both the main list page and any related pages
    revalidatePath('/calls');
    revalidatePath('/calls/new');
    callToast.created();

    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to create call:', error);
    callToast.createError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function updateCallAction(id: number, data: any) {
  try {
    // Update entity using the generated API function with correct signature
    const result = await updateCall(id, data);

    // Revalidate all related paths to ensure fresh data
    revalidatePath('/calls');
    revalidatePath(`/calls/${id}`);
    revalidatePath(`/calls/${id}/edit`);
    callToast.updated();

    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to update call:', error);
    callToast.updateError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function archiveCallAction(id: number, entityData: any) {
  try {
    const archivedEntity = {
      ...entityData,
      status: CallDTOStatus.ARCHIVED,
    };

    const result = await updateCall(id, archivedEntity);

    revalidatePath('/calls');
    callToast.custom.success('Archived Successfully', 'Call has been archived');

    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to archive call:', error);
    callToast.custom.error('Archive Failed', error?.message || 'Could not archive call');
    return { success: false, error: error?.message };
  }
}

export async function updateStatusCallAction(id: number, entityData: any, newStatus: string) {
  try {
    const statusValue = CallDTOStatus[newStatus as keyof typeof CallDTOStatus];
    const updatedEntity = {
      ...entityData,
      status: statusValue,
    };

    const result = await updateCall(id, updatedEntity);

    revalidatePath('/calls');
    callToast.custom.success('Status Updated', `Call status changed to ${newStatus.toLowerCase()}`);

    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to update call status:', error);
    callToast.custom.error(
      'Status Update Failed',
      error?.message || 'Could not update call status'
    );
    return { success: false, error: error?.message };
  }
}

export async function bulkArchiveCallAction(ids: number[], entitiesData: any[]) {
  try {
    const results = await Promise.allSettled(
      ids.map(async (id, index) => {
        const entityData = entitiesData[index];
        const archivedEntity = {
          ...entityData,
          status: CallDTOStatus.ARCHIVED,
        };
        return updateCall(id, archivedEntity);
      })
    );

    const successCount = results.filter((r) => r.status === 'fulfilled').length;
    const errorCount = results.filter((r) => r.status === 'rejected').length;

    // Revalidate to ensure table reflects changes
    revalidatePath('/calls');

    if (errorCount === 0) {
      callToast.custom.success(
        'Bulk Archive Complete',
        `${successCount} item${successCount > 1 ? 's' : ''} archived successfully`
      );
    } else {
      callToast.custom.warning('Partial Archive', `${successCount} archived, ${errorCount} failed`);
    }

    return { success: errorCount === 0, successCount, errorCount };
  } catch (error) {
    console.error('Bulk archive failed:', error);
    callToast.custom.error('Bulk Archive Failed', error?.message || 'Could not archive items');
    return { success: false, error: error?.message };
  }
}

export async function bulkUpdateStatusCallAction(
  ids: number[],
  entitiesData: any[],
  newStatus: string
) {
  try {
    const statusValue = CallDTOStatus[newStatus as keyof typeof CallDTOStatus];
    const results = await Promise.allSettled(
      ids.map(async (id, index) => {
        const entityData = entitiesData[index];
        const updatedEntity = {
          ...entityData,
          status: statusValue,
        };
        return updateCall(id, updatedEntity);
      })
    );

    const successCount = results.filter((r) => r.status === 'fulfilled').length;
    const errorCount = results.filter((r) => r.status === 'rejected').length;

    // Revalidate to ensure table reflects changes
    revalidatePath('/calls');

    if (errorCount === 0) {
      callToast.custom.success(
        'Bulk Status Update Complete',
        `${successCount} item${successCount > 1 ? 's' : ''} updated to ${newStatus.toLowerCase()}`
      );
    } else {
      callToast.custom.warning(
        'Partial Status Update',
        `${successCount} updated, ${errorCount} failed`
      );
    }

    return { success: errorCount === 0, successCount, errorCount };
  } catch (error) {
    console.error('Bulk status update failed:', error);
    callToast.custom.error(
      'Bulk Status Update Failed',
      error?.message || 'Could not update status for items'
    );
    return { success: false, error: error?.message };
  }
}
