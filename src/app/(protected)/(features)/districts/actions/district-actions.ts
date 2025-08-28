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
  createDistrict,
  updateDistrict,
} from '@/core/api/generated/spring/endpoints/district-resource/district-resource.gen';
import { DistrictDTOStatus } from '@/core/api/generated/spring/schemas/DistrictDTOStatus';
import { districtToast } from '../components/district-toast';

export async function createDistrictAction(data: any) {
  try {
    // Create entity using the generated API function
    const result = await createDistrict(data);

    // Revalidate both the main list page and any related pages
    revalidatePath('/districts');
    revalidatePath('/districts/new');
    districtToast.created();

    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to create district:', error);
    districtToast.createError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function updateDistrictAction(id: number, data: any) {
  try {
    // Update entity using the generated API function with correct signature
    const result = await updateDistrict(id, data);

    // Revalidate all related paths to ensure fresh data
    revalidatePath('/districts');
    revalidatePath(`/districts/${id}`);
    revalidatePath(`/districts/${id}/edit`);
    districtToast.updated();

    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to update district:', error);
    districtToast.updateError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function archiveDistrictAction(id: number, entityData: any) {
  try {
    const archivedEntity = {
      ...entityData,
      status: DistrictDTOStatus.ARCHIVED,
    };

    const result = await updateDistrict(id, archivedEntity);

    revalidatePath('/districts');
    districtToast.custom.success('Archived Successfully', 'District has been archived');

    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to archive district:', error);
    districtToast.custom.error('Archive Failed', error?.message || 'Could not archive district');
    return { success: false, error: error?.message };
  }
}

export async function updateStatusDistrictAction(id: number, entityData: any, newStatus: string) {
  try {
    const statusValue = DistrictDTOStatus[newStatus as keyof typeof DistrictDTOStatus];
    const updatedEntity = {
      ...entityData,
      status: statusValue,
    };

    const result = await updateDistrict(id, updatedEntity);

    revalidatePath('/districts');
    districtToast.custom.success(
      'Status Updated',
      `District status changed to ${newStatus.toLowerCase()}`
    );

    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to update district status:', error);
    districtToast.custom.error(
      'Status Update Failed',
      error?.message || 'Could not update district status'
    );
    return { success: false, error: error?.message };
  }
}

export async function bulkArchiveDistrictAction(ids: number[], entitiesData: any[]) {
  try {
    const results = await Promise.allSettled(
      ids.map(async (id, index) => {
        const entityData = entitiesData[index];
        const archivedEntity = {
          ...entityData,
          status: DistrictDTOStatus.ARCHIVED,
        };
        return updateDistrict(id, archivedEntity);
      })
    );

    const successCount = results.filter((r) => r.status === 'fulfilled').length;
    const errorCount = results.filter((r) => r.status === 'rejected').length;

    // Revalidate to ensure table reflects changes
    revalidatePath('/districts');

    if (errorCount === 0) {
      districtToast.custom.success(
        'Bulk Archive Complete',
        `${successCount} item${successCount > 1 ? 's' : ''} archived successfully`
      );
    } else {
      districtToast.custom.warning(
        'Partial Archive',
        `${successCount} archived, ${errorCount} failed`
      );
    }

    return { success: errorCount === 0, successCount, errorCount };
  } catch (error) {
    console.error('Bulk archive failed:', error);
    districtToast.custom.error('Bulk Archive Failed', error?.message || 'Could not archive items');
    return { success: false, error: error?.message };
  }
}

export async function bulkUpdateStatusDistrictAction(
  ids: number[],
  entitiesData: any[],
  newStatus: string
) {
  try {
    const statusValue = DistrictDTOStatus[newStatus as keyof typeof DistrictDTOStatus];
    const results = await Promise.allSettled(
      ids.map(async (id, index) => {
        const entityData = entitiesData[index];
        const updatedEntity = {
          ...entityData,
          status: statusValue,
        };
        return updateDistrict(id, updatedEntity);
      })
    );

    const successCount = results.filter((r) => r.status === 'fulfilled').length;
    const errorCount = results.filter((r) => r.status === 'rejected').length;

    // Revalidate to ensure table reflects changes
    revalidatePath('/districts');

    if (errorCount === 0) {
      districtToast.custom.success(
        'Bulk Status Update Complete',
        `${successCount} item${successCount > 1 ? 's' : ''} updated to ${newStatus.toLowerCase()}`
      );
    } else {
      districtToast.custom.warning(
        'Partial Status Update',
        `${successCount} updated, ${errorCount} failed`
      );
    }

    return { success: errorCount === 0, successCount, errorCount };
  } catch (error) {
    console.error('Bulk status update failed:', error);
    districtToast.custom.error(
      'Bulk Status Update Failed',
      error?.message || 'Could not update status for items'
    );
    return { success: false, error: error?.message };
  }
}
