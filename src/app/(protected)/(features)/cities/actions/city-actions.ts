'use server';

import { revalidatePath } from 'next/cache';

import {
  createCity,
  updateCity,
} from '@/core/api/generated/spring/endpoints/city-resource/city-resource.gen';
import { CityDTOStatus } from '@/core/api/generated/spring/schemas/CityDTOStatus';
import { cityToast } from '../components/city-toast';

export async function createCityAction(data: any) {
  try {
    const result = await createCity(data);

    revalidatePath('/cities');
    revalidatePath('/cities/new');
    cityToast.created();

    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to create city:', error);
    cityToast.createError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function updateCityAction(id: number, data: any) {
  try {
    const result = await updateCity(id, data);

    revalidatePath('/cities');
    revalidatePath(`/cities/${id}`);
    revalidatePath(`/cities/${id}/edit`);
    cityToast.updated();

    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to update city:', error);
    cityToast.updateError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function archiveCityAction(id: number, entityData: any) {
  try {
    const archivedEntity = {
      ...entityData,
      status: CityDTOStatus.ARCHIVED,
    };

    const result = await updateCity(id, archivedEntity);

    revalidatePath('/cities');
    cityToast.custom.success('Archived Successfully', 'City has been archived');

    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to archive city:', error);
    cityToast.custom.error('Archive Failed', error?.message || 'Could not archive city');
    return { success: false, error: error?.message };
  }
}

export async function updateStatusCityAction(id: number, entityData: any, newStatus: string) {
  try {
    const statusValue = CityDTOStatus[newStatus as keyof typeof CityDTOStatus];
    const updatedEntity = {
      ...entityData,
      status: statusValue,
    };

    const result = await updateCity(id, updatedEntity);

    revalidatePath('/cities');
    cityToast.custom.success('Status Updated', `City status changed to ${newStatus.toLowerCase()}`);

    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to update city status:', error);
    cityToast.custom.error(
      'Status Update Failed',
      error?.message || 'Could not update city status'
    );
    return { success: false, error: error?.message };
  }
}

export async function bulkArchiveCityAction(ids: number[], entitiesData: any[]) {
  try {
    const results = await Promise.allSettled(
      ids.map(async (id, index) => {
        const entityData = entitiesData[index];
        const archivedEntity = {
          ...entityData,
          status: CityDTOStatus.ARCHIVED,
        };
        return updateCity(id, archivedEntity);
      })
    );

    const successCount = results.filter((r) => r.status === 'fulfilled').length;
    const errorCount = results.filter((r) => r.status === 'rejected').length;

    revalidatePath('/cities');

    if (errorCount === 0) {
      cityToast.custom.success(
        'Bulk Archive Complete',
        `${successCount} item${successCount > 1 ? 's' : ''} archived successfully`
      );
    } else {
      cityToast.custom.warning('Partial Archive', `${successCount} archived, ${errorCount} failed`);
    }

    return { success: errorCount === 0, successCount, errorCount };
  } catch (error) {
    console.error('Bulk archive failed:', error);
    cityToast.custom.error('Bulk Archive Failed', error?.message || 'Could not archive items');
    return { success: false, error: error?.message };
  }
}

export async function bulkUpdateStatusCityAction(
  ids: number[],
  entitiesData: any[],
  newStatus: string
) {
  try {
    const statusValue = CityDTOStatus[newStatus as keyof typeof CityDTOStatus];
    const results = await Promise.allSettled(
      ids.map(async (id, index) => {
        const entityData = entitiesData[index];
        const updatedEntity = {
          ...entityData,
          status: statusValue,
        };
        return updateCity(id, updatedEntity);
      })
    );

    const successCount = results.filter((r) => r.status === 'fulfilled').length;
    const errorCount = results.filter((r) => r.status === 'rejected').length;

    revalidatePath('/cities');

    if (errorCount === 0) {
      cityToast.custom.success(
        'Bulk Status Update Complete',
        `${successCount} item${successCount > 1 ? 's' : ''} updated to ${newStatus.toLowerCase()}`
      );
    } else {
      cityToast.custom.warning(
        'Partial Status Update',
        `${successCount} updated, ${errorCount} failed`
      );
    }

    return { success: errorCount === 0, successCount, errorCount };
  } catch (error) {
    console.error('Bulk status update failed:', error);
    cityToast.custom.error(
      'Bulk Status Update Failed',
      error?.message || 'Could not update status for items'
    );
    return { success: false, error: error?.message };
  }
}
