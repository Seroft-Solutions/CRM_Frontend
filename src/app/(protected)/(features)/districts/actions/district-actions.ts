'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { toast } from 'sonner';
import { districtToast } from '../components/district-toast';

export async function createDistrictAction(formData: FormData) {
  try {
    // Process form data and create entity
    const result = await createDistrict(formData);

    revalidatePath('/districts');
    districtToast.created();

    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to create district:', error);
    districtToast.createError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function updateDistrictAction(id: number, formData: FormData) {
  try {
    const result = await updateDistrict(id, formData);

    revalidatePath('/districts');
    revalidatePath(`/districts/${id}`);
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

    revalidatePath('/districts');

    if (errorCount === 0) {
      districtToast.bulkDeleted(successCount);
    } else if (successCount > 0) {
      toast.warning(`${successCount} deleted, ${errorCount} failed`);
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
