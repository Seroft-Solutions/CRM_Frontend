'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import {
  createCallType,
  updateCallType,
} from '@/core/api/generated/spring/endpoints/call-type-resource/call-type-resource.gen';
import { CallTypeDTOStatus } from '@/core/api/generated/spring/schemas/CallTypeDTOStatus';
import { callTypeToast } from '../components/call-type-toast';

export async function createCallTypeAction(data: any) {
  try {
    const result = await createCallType(data);

    revalidatePath('/call-types');
    revalidatePath('/call-types/new');
    callTypeToast.created();

    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to create calltype:', error);
    callTypeToast.createError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function updateCallTypeAction(id: number, data: any) {
  try {
    const result = await updateCallType(id, data);

    revalidatePath('/call-types');
    revalidatePath(`/call-types/${id}`);
    revalidatePath(`/call-types/${id}/edit`);
    callTypeToast.updated();

    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to update calltype:', error);
    callTypeToast.updateError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function archiveCallTypeAction(id: number, entityData: any) {
  try {
    const archivedEntity = {
      ...entityData,
      status: CallTypeDTOStatus.ARCHIVED,
    };

    const result = await updateCallType(id, archivedEntity);

    revalidatePath('/call-types');
    callTypeToast.custom.success('Archived Successfully', 'CallType has been archived');

    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to archive calltype:', error);
    callTypeToast.custom.error('Archive Failed', error?.message || 'Could not archive calltype');
    return { success: false, error: error?.message };
  }
}

export async function updateStatusCallTypeAction(id: number, entityData: any, newStatus: string) {
  try {
    const statusValue = CallTypeDTOStatus[newStatus as keyof typeof CallTypeDTOStatus];
    const updatedEntity = {
      ...entityData,
      status: statusValue,
    };

    const result = await updateCallType(id, updatedEntity);

    revalidatePath('/call-types');
    callTypeToast.custom.success(
      'Status Updated',
      `CallType status changed to ${newStatus.toLowerCase()}`
    );

    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to update calltype status:', error);
    callTypeToast.custom.error(
      'Status Update Failed',
      error?.message || 'Could not update calltype status'
    );
    return { success: false, error: error?.message };
  }
}

export async function bulkArchiveCallTypeAction(ids: number[], entitiesData: any[]) {
  try {
    const results = await Promise.allSettled(
      ids.map(async (id, index) => {
        const entityData = entitiesData[index];
        const archivedEntity = {
          ...entityData,
          status: CallTypeDTOStatus.ARCHIVED,
        };
        return updateCallType(id, archivedEntity);
      })
    );

    const successCount = results.filter((r) => r.status === 'fulfilled').length;
    const errorCount = results.filter((r) => r.status === 'rejected').length;

    revalidatePath('/call-types');

    if (errorCount === 0) {
      callTypeToast.custom.success(
        'Bulk Archive Complete',
        `${successCount} item${successCount > 1 ? 's' : ''} archived successfully`
      );
    } else {
      callTypeToast.custom.warning(
        'Partial Archive',
        `${successCount} archived, ${errorCount} failed`
      );
    }

    return { success: errorCount === 0, successCount, errorCount };
  } catch (error) {
    console.error('Bulk archive failed:', error);
    callTypeToast.custom.error('Bulk Archive Failed', error?.message || 'Could not archive items');
    return { success: false, error: error?.message };
  }
}

export async function bulkUpdateStatusCallTypeAction(
  ids: number[],
  entitiesData: any[],
  newStatus: string
) {
  try {
    const statusValue = CallTypeDTOStatus[newStatus as keyof typeof CallTypeDTOStatus];
    const results = await Promise.allSettled(
      ids.map(async (id, index) => {
        const entityData = entitiesData[index];
        const updatedEntity = {
          ...entityData,
          status: statusValue,
        };
        return updateCallType(id, updatedEntity);
      })
    );

    const successCount = results.filter((r) => r.status === 'fulfilled').length;
    const errorCount = results.filter((r) => r.status === 'rejected').length;

    revalidatePath('/call-types');

    if (errorCount === 0) {
      callTypeToast.custom.success(
        'Bulk Status Update Complete',
        `${successCount} item${successCount > 1 ? 's' : ''} updated to ${newStatus.toLowerCase()}`
      );
    } else {
      callTypeToast.custom.warning(
        'Partial Status Update',
        `${successCount} updated, ${errorCount} failed`
      );
    }

    return { success: errorCount === 0, successCount, errorCount };
  } catch (error) {
    console.error('Bulk status update failed:', error);
    callTypeToast.custom.error(
      'Bulk Status Update Failed',
      error?.message || 'Could not update status for items'
    );
    return { success: false, error: error?.message };
  }
}
