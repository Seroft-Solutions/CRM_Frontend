'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import {
  createSource,
  updateSource,
} from '@/core/api/generated/spring/endpoints/source-resource/source-resource.gen';
import { SourceDTOStatus } from '@/core/api/generated/spring/schemas/SourceDTOStatus';
import { sourceToast } from '../components/source-toast';

export async function createSourceAction(data: any) {
  try {
    const result = await createSource(data);

    revalidatePath('/sources');
    revalidatePath('/sources/new');
    sourceToast.created();

    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to create source:', error);
    sourceToast.createError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function updateSourceAction(id: number, data: any) {
  try {
    const result = await updateSource(id, data);

    revalidatePath('/sources');
    revalidatePath(`/sources/${id}`);
    revalidatePath(`/sources/${id}/edit`);
    sourceToast.updated();

    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to update source:', error);
    sourceToast.updateError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function archiveSourceAction(id: number, entityData: any) {
  try {
    const archivedEntity = {
      ...entityData,
      status: SourceDTOStatus.ARCHIVED,
    };

    const result = await updateSource(id, archivedEntity);

    revalidatePath('/sources');
    sourceToast.custom.success('Archived Successfully', 'Source has been archived');

    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to archive source:', error);
    sourceToast.custom.error('Archive Failed', error?.message || 'Could not archive source');
    return { success: false, error: error?.message };
  }
}

export async function updateStatusSourceAction(id: number, entityData: any, newStatus: string) {
  try {
    const statusValue = SourceDTOStatus[newStatus as keyof typeof SourceDTOStatus];
    const updatedEntity = {
      ...entityData,
      status: statusValue,
    };

    const result = await updateSource(id, updatedEntity);

    revalidatePath('/sources');
    sourceToast.custom.success(
      'Status Updated',
      `Source status changed to ${newStatus.toLowerCase()}`
    );

    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to update source status:', error);
    sourceToast.custom.error(
      'Status Update Failed',
      error?.message || 'Could not update source status'
    );
    return { success: false, error: error?.message };
  }
}

export async function bulkArchiveSourceAction(ids: number[], entitiesData: any[]) {
  try {
    const results = await Promise.allSettled(
      ids.map(async (id, index) => {
        const entityData = entitiesData[index];
        const archivedEntity = {
          ...entityData,
          status: SourceDTOStatus.ARCHIVED,
        };
        return updateSource(id, archivedEntity);
      })
    );

    const successCount = results.filter((r) => r.status === 'fulfilled').length;
    const errorCount = results.filter((r) => r.status === 'rejected').length;

    revalidatePath('/sources');

    if (errorCount === 0) {
      sourceToast.custom.success(
        'Bulk Archive Complete',
        `${successCount} item${successCount > 1 ? 's' : ''} archived successfully`
      );
    } else {
      sourceToast.custom.warning(
        'Partial Archive',
        `${successCount} archived, ${errorCount} failed`
      );
    }

    return { success: errorCount === 0, successCount, errorCount };
  } catch (error) {
    console.error('Bulk archive failed:', error);
    sourceToast.custom.error('Bulk Archive Failed', error?.message || 'Could not archive items');
    return { success: false, error: error?.message };
  }
}

export async function bulkUpdateStatusSourceAction(
  ids: number[],
  entitiesData: any[],
  newStatus: string
) {
  try {
    const statusValue = SourceDTOStatus[newStatus as keyof typeof SourceDTOStatus];
    const results = await Promise.allSettled(
      ids.map(async (id, index) => {
        const entityData = entitiesData[index];
        const updatedEntity = {
          ...entityData,
          status: statusValue,
        };
        return updateSource(id, updatedEntity);
      })
    );

    const successCount = results.filter((r) => r.status === 'fulfilled').length;
    const errorCount = results.filter((r) => r.status === 'rejected').length;

    revalidatePath('/sources');

    if (errorCount === 0) {
      sourceToast.custom.success(
        'Bulk Status Update Complete',
        `${successCount} item${successCount > 1 ? 's' : ''} updated to ${newStatus.toLowerCase()}`
      );
    } else {
      sourceToast.custom.warning(
        'Partial Status Update',
        `${successCount} updated, ${errorCount} failed`
      );
    }

    return { success: errorCount === 0, successCount, errorCount };
  } catch (error) {
    console.error('Bulk status update failed:', error);
    sourceToast.custom.error(
      'Bulk Status Update Failed',
      error?.message || 'Could not update status for items'
    );
    return { success: false, error: error?.message };
  }
}
