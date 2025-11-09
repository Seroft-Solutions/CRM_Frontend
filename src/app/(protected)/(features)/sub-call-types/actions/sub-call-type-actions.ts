'use server';

import { revalidatePath } from 'next/cache';

import {
  createSubCallType,
  updateSubCallType,
} from '@/core/api/generated/spring/endpoints/sub-call-type-resource/sub-call-type-resource.gen';
import { SubCallTypeDTOStatus } from '@/core/api/generated/spring/schemas/SubCallTypeDTOStatus';
import { subCallTypeToast } from '../components/sub-call-type-toast';

export async function createSubCallTypeAction(data: any) {
  try {
    const result = await createSubCallType(data);

    revalidatePath('/sub-call-types');
    revalidatePath('/sub-call-types/new');
    subCallTypeToast.created();

    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to create subcalltype:', error);
    subCallTypeToast.createError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function updateSubCallTypeAction(id: number, data: any) {
  try {
    const result = await updateSubCallType(id, data);

    revalidatePath('/sub-call-types');
    revalidatePath(`/sub-call-types/${id}`);
    revalidatePath(`/sub-call-types/${id}/edit`);
    subCallTypeToast.updated();

    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to update subcalltype:', error);
    subCallTypeToast.updateError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function archiveSubCallTypeAction(id: number, entityData: any) {
  try {
    const archivedEntity = {
      ...entityData,
      status: SubCallTypeDTOStatus.ARCHIVED,
    };

    const result = await updateSubCallType(id, archivedEntity);

    revalidatePath('/sub-call-types');
    subCallTypeToast.custom.success('Archived Successfully', 'SubCallType has been archived');

    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to archive subcalltype:', error);
    subCallTypeToast.custom.error(
      'Archive Failed',
      error?.message || 'Could not archive subcalltype'
    );
    return { success: false, error: error?.message };
  }
}

export async function updateStatusSubCallTypeAction(
  id: number,
  entityData: any,
  newStatus: string
) {
  try {
    const statusValue = SubCallTypeDTOStatus[newStatus as keyof typeof SubCallTypeDTOStatus];
    const updatedEntity = {
      ...entityData,
      status: statusValue,
    };

    const result = await updateSubCallType(id, updatedEntity);

    revalidatePath('/sub-call-types');
    subCallTypeToast.custom.success(
      'Status Updated',
      `SubCallType status changed to ${newStatus.toLowerCase()}`
    );

    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to update subcalltype status:', error);
    subCallTypeToast.custom.error(
      'Status Update Failed',
      error?.message || 'Could not update subcalltype status'
    );
    return { success: false, error: error?.message };
  }
}

export async function bulkArchiveSubCallTypeAction(ids: number[], entitiesData: any[]) {
  try {
    const results = await Promise.allSettled(
      ids.map(async (id, index) => {
        const entityData = entitiesData[index];
        const archivedEntity = {
          ...entityData,
          status: SubCallTypeDTOStatus.ARCHIVED,
        };
        return updateSubCallType(id, archivedEntity);
      })
    );

    const successCount = results.filter((r) => r.status === 'fulfilled').length;
    const errorCount = results.filter((r) => r.status === 'rejected').length;

    revalidatePath('/sub-call-types');

    if (errorCount === 0) {
      subCallTypeToast.custom.success(
        'Bulk Archive Complete',
        `${successCount} item${successCount > 1 ? 's' : ''} archived successfully`
      );
    } else {
      subCallTypeToast.custom.warning(
        'Partial Archive',
        `${successCount} archived, ${errorCount} failed`
      );
    }

    return { success: errorCount === 0, successCount, errorCount };
  } catch (error) {
    console.error('Bulk archive failed:', error);
    subCallTypeToast.custom.error(
      'Bulk Archive Failed',
      error?.message || 'Could not archive items'
    );
    return { success: false, error: error?.message };
  }
}

export async function bulkUpdateStatusSubCallTypeAction(
  ids: number[],
  entitiesData: any[],
  newStatus: string
) {
  try {
    const statusValue = SubCallTypeDTOStatus[newStatus as keyof typeof SubCallTypeDTOStatus];
    const results = await Promise.allSettled(
      ids.map(async (id, index) => {
        const entityData = entitiesData[index];
        const updatedEntity = {
          ...entityData,
          status: statusValue,
        };
        return updateSubCallType(id, updatedEntity);
      })
    );

    const successCount = results.filter((r) => r.status === 'fulfilled').length;
    const errorCount = results.filter((r) => r.status === 'rejected').length;

    revalidatePath('/sub-call-types');

    if (errorCount === 0) {
      subCallTypeToast.custom.success(
        'Bulk Status Update Complete',
        `${successCount} item${successCount > 1 ? 's' : ''} updated to ${newStatus.toLowerCase()}`
      );
    } else {
      subCallTypeToast.custom.warning(
        'Partial Status Update',
        `${successCount} updated, ${errorCount} failed`
      );
    }

    return { success: errorCount === 0, successCount, errorCount };
  } catch (error) {
    console.error('Bulk status update failed:', error);
    subCallTypeToast.custom.error(
      'Bulk Status Update Failed',
      error?.message || 'Could not update status for items'
    );
    return { success: false, error: error?.message };
  }
}
