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
  deleteDistrict,
} from '@/core/api/generated/spring/endpoints/district-resource/district-resource.gen';
import { districtToast } from '@/app/(protected)/(features)/districts/components/district-toast';

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

export async function deleteDistrictAction(id: number) {
  try {
    await deleteDistrict(id);

    revalidatePath('/districts');
    districtToast.deleted();

    return { success: true };
  } catch (error) {
    console.error('Failed to delete district:', error);
    districtToast.deleteError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function bulkDeleteDistrictAction(ids: number[]) {
  try {
    const results = await Promise.allSettled(ids.map((id) => deleteDistrict(id)));

    const successCount = results.filter((r) => r.status === 'fulfilled').length;
    const errorCount = results.filter((r) => r.status === 'rejected').length;

    // Revalidate to ensure table reflects deletions
    revalidatePath('/districts');

    if (errorCount === 0) {
      districtToast.bulkDeleted(successCount);
    } else {
      districtToast.bulkDeleteError();
    }

    return { success: errorCount === 0, successCount, errorCount };
  } catch (error) {
    console.error('Bulk delete failed:', error);
    districtToast.bulkDeleteError(error?.message);
    return { success: false, error: error?.message };
  }
}
