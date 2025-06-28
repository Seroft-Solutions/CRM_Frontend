'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { toast } from 'sonner';
import { areaToast } from '../components/area-toast';

export async function createAreaAction(formData: FormData) {
  try {
    // Process form data and create entity
    const result = await createArea(formData);

    revalidatePath('/areas');
    areaToast.created();

    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to create area:', error);
    areaToast.createError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function updateAreaAction(id: number, formData: FormData) {
  try {
    const result = await updateArea(id, formData);

    revalidatePath('/areas');
    revalidatePath(`/areas/${id}`);
    areaToast.updated();

    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to update area:', error);
    areaToast.updateError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function deleteAreaAction(id: number) {
  try {
    await deleteArea(id);

    revalidatePath('/areas');
    areaToast.deleted();

    return { success: true };
  } catch (error) {
    console.error('Failed to delete area:', error);
    areaToast.deleteError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function bulkDeleteAreaAction(ids: number[]) {
  try {
    const results = await Promise.allSettled(ids.map((id) => deleteArea(id)));

    const successCount = results.filter((r) => r.status === 'fulfilled').length;
    const errorCount = results.filter((r) => r.status === 'rejected').length;

    revalidatePath('/areas');

    if (errorCount === 0) {
      areaToast.bulkDeleted(successCount);
    } else if (successCount > 0) {
      toast.warning(`${successCount} deleted, ${errorCount} failed`);
    } else {
      areaToast.bulkDeleteError();
    }

    return { success: errorCount === 0, successCount, errorCount };
  } catch (error) {
    console.error('Bulk delete failed:', error);
    areaToast.bulkDeleteError(error?.message);
    return { success: false, error: error?.message };
  }
}
