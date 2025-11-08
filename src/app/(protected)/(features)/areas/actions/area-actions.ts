'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import {
  createArea,
  updateArea,
} from '@/core/api/generated/spring/endpoints/area-resource/area-resource.gen';
import { AreaDTOStatus } from '@/core/api/generated/spring/schemas/AreaDTOStatus';
import { areaToast } from '../components/area-toast';

export async function createAreaAction(data: any) {
  try {
    const result = await createArea(data);

    revalidatePath('/areas');
    revalidatePath('/areas/new');
    areaToast.created();

    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to create area:', error);
    areaToast.createError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function updateAreaAction(id: number, data: any) {
  try {
    const result = await updateArea(id, data);

    revalidatePath('/areas');
    revalidatePath(`/areas/${id}`);
    revalidatePath(`/areas/${id}/edit`);
    areaToast.updated();

    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to update area:', error);
    areaToast.updateError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function archiveAreaAction(id: number, entityData: any) {
  try {
    const archivedEntity = {
      ...entityData,
      status: AreaDTOStatus.ARCHIVED,
    };

    const result = await updateArea(id, archivedEntity);

    revalidatePath('/areas');
    areaToast.custom.success('Archived Successfully', 'Area has been archived');

    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to archive area:', error);
    areaToast.custom.error('Archive Failed', error?.message || 'Could not archive area');
    return { success: false, error: error?.message };
  }
}

export async function updateStatusAreaAction(id: number, entityData: any, newStatus: string) {
  try {
    const statusValue = AreaDTOStatus[newStatus as keyof typeof AreaDTOStatus];
    const updatedEntity = {
      ...entityData,
      status: statusValue,
    };

    const result = await updateArea(id, updatedEntity);

    revalidatePath('/areas');
    areaToast.custom.success('Status Updated', `Area status changed to ${newStatus.toLowerCase()}`);

    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to update area status:', error);
    areaToast.custom.error(
      'Status Update Failed',
      error?.message || 'Could not update area status'
    );
    return { success: false, error: error?.message };
  }
}

export async function bulkArchiveAreaAction(ids: number[], entitiesData: any[]) {
  try {
    const results = await Promise.allSettled(
      ids.map(async (id, index) => {
        const entityData = entitiesData[index];
        const archivedEntity = {
          ...entityData,
          status: AreaDTOStatus.ARCHIVED,
        };
        return updateArea(id, archivedEntity);
      })
    );

    const successCount = results.filter((r) => r.status === 'fulfilled').length;
    const errorCount = results.filter((r) => r.status === 'rejected').length;

    revalidatePath('/areas');

    if (errorCount === 0) {
      areaToast.custom.success(
        'Bulk Archive Complete',
        `${successCount} item${successCount > 1 ? 's' : ''} archived successfully`
      );
    } else {
      areaToast.custom.warning('Partial Archive', `${successCount} archived, ${errorCount} failed`);
    }

    return { success: errorCount === 0, successCount, errorCount };
  } catch (error) {
    console.error('Bulk archive failed:', error);
    areaToast.custom.error('Bulk Archive Failed', error?.message || 'Could not archive items');
    return { success: false, error: error?.message };
  }
}

export async function bulkUpdateStatusAreaAction(
  ids: number[],
  entitiesData: any[],
  newStatus: string
) {
  try {
    const statusValue = AreaDTOStatus[newStatus as keyof typeof AreaDTOStatus];
    const results = await Promise.allSettled(
      ids.map(async (id, index) => {
        const entityData = entitiesData[index];
        const updatedEntity = {
          ...entityData,
          status: statusValue,
        };
        return updateArea(id, updatedEntity);
      })
    );

    const successCount = results.filter((r) => r.status === 'fulfilled').length;
    const errorCount = results.filter((r) => r.status === 'rejected').length;

    revalidatePath('/areas');

    if (errorCount === 0) {
      areaToast.custom.success(
        'Bulk Status Update Complete',
        `${successCount} item${successCount > 1 ? 's' : ''} updated to ${newStatus.toLowerCase()}`
      );
    } else {
      areaToast.custom.warning(
        'Partial Status Update',
        `${successCount} updated, ${errorCount} failed`
      );
    }

    return { success: errorCount === 0, successCount, errorCount };
  } catch (error) {
    console.error('Bulk status update failed:', error);
    areaToast.custom.error(
      'Bulk Status Update Failed',
      error?.message || 'Could not update status for items'
    );
    return { success: false, error: error?.message };
  }
}
