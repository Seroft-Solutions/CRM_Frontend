'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import {
  createCallStatus,
  updateCallStatus,
} from '@/core/api/generated/spring/endpoints/call-status-resource/call-status-resource.gen';
import { CallStatusDTOStatus } from '@/core/api/generated/spring/schemas/CallStatusDTOStatus';
import { callStatusToast } from '../components/call-status-toast';

export async function createCallStatusAction(data: any) {
  try {
    const result = await createCallStatus(data);

    revalidatePath('/call-statuses');
    revalidatePath('/call-statuses/new');
    callStatusToast.created();

    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to create callstatus:', error);
    callStatusToast.createError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function updateCallStatusAction(id: number, data: any) {
  try {
    const result = await updateCallStatus(id, data);

    revalidatePath('/call-statuses');
    revalidatePath(`/call-statuses/${id}`);
    revalidatePath(`/call-statuses/${id}/edit`);
    callStatusToast.updated();

    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to update callstatus:', error);
    callStatusToast.updateError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function archiveCallStatusAction(id: number, entityData: any) {
  try {
    const archivedEntity = {
      ...entityData,
      status: CallStatusDTOStatus.ARCHIVED,
    };

    const result = await updateCallStatus(id, archivedEntity);

    revalidatePath('/call-statuses');
    callStatusToast.custom.success('Archived Successfully', 'CallStatus has been archived');

    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to archive callstatus:', error);
    callStatusToast.custom.error(
      'Archive Failed',
      error?.message || 'Could not archive callstatus'
    );
    return { success: false, error: error?.message };
  }
}

export async function updateStatusCallStatusAction(id: number, entityData: any, newStatus: string) {
  try {
    const statusValue = CallStatusDTOStatus[newStatus as keyof typeof CallStatusDTOStatus];
    const updatedEntity = {
      ...entityData,
      status: statusValue,
    };

    const result = await updateCallStatus(id, updatedEntity);

    revalidatePath('/call-statuses');
    callStatusToast.custom.success(
      'Status Updated',
      `CallStatus status changed to ${newStatus.toLowerCase()}`
    );

    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to update callstatus status:', error);
    callStatusToast.custom.error(
      'Status Update Failed',
      error?.message || 'Could not update callstatus status'
    );
    return { success: false, error: error?.message };
  }
}

export async function bulkArchiveCallStatusAction(ids: number[], entitiesData: any[]) {
  try {
    const results = await Promise.allSettled(
      ids.map(async (id, index) => {
        const entityData = entitiesData[index];
        const archivedEntity = {
          ...entityData,
          status: CallStatusDTOStatus.ARCHIVED,
        };
        return updateCallStatus(id, archivedEntity);
      })
    );

    const successCount = results.filter((r) => r.status === 'fulfilled').length;
    const errorCount = results.filter((r) => r.status === 'rejected').length;

    revalidatePath('/call-statuses');

    if (errorCount === 0) {
      callStatusToast.custom.success(
        'Bulk Archive Complete',
        `${successCount} item${successCount > 1 ? 's' : ''} archived successfully`
      );
    } else {
      callStatusToast.custom.warning(
        'Partial Archive',
        `${successCount} archived, ${errorCount} failed`
      );
    }

    return { success: errorCount === 0, successCount, errorCount };
  } catch (error) {
    console.error('Bulk archive failed:', error);
    callStatusToast.custom.error(
      'Bulk Archive Failed',
      error?.message || 'Could not archive items'
    );
    return { success: false, error: error?.message };
  }
}

export async function bulkUpdateStatusCallStatusAction(
  ids: number[],
  entitiesData: any[],
  newStatus: string
) {
  try {
    const statusValue = CallStatusDTOStatus[newStatus as keyof typeof CallStatusDTOStatus];
    const results = await Promise.allSettled(
      ids.map(async (id, index) => {
        const entityData = entitiesData[index];
        const updatedEntity = {
          ...entityData,
          status: statusValue,
        };
        return updateCallStatus(id, updatedEntity);
      })
    );

    const successCount = results.filter((r) => r.status === 'fulfilled').length;
    const errorCount = results.filter((r) => r.status === 'rejected').length;

    revalidatePath('/call-statuses');

    if (errorCount === 0) {
      callStatusToast.custom.success(
        'Bulk Status Update Complete',
        `${successCount} item${successCount > 1 ? 's' : ''} updated to ${newStatus.toLowerCase()}`
      );
    } else {
      callStatusToast.custom.warning(
        'Partial Status Update',
        `${successCount} updated, ${errorCount} failed`
      );
    }

    return { success: errorCount === 0, successCount, errorCount };
  } catch (error) {
    console.error('Bulk status update failed:', error);
    callStatusToast.custom.error(
      'Bulk Status Update Failed',
      error?.message || 'Could not update status for items'
    );
    return { success: false, error: error?.message };
  }
}
