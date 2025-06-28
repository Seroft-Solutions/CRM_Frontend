'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { toast } from 'sonner';
import { sourceToast } from '../components/source-toast';

export async function createSourceAction(formData: FormData) {
  try {
    // Process form data and create entity
    const result = await createSource(formData);

    revalidatePath('/sources');
    sourceToast.created();

    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to create source:', error);
    sourceToast.createError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function updateSourceAction(id: number, formData: FormData) {
  try {
    const result = await updateSource(id, formData);

    revalidatePath('/sources');
    revalidatePath(`/sources/${id}`);
    sourceToast.updated();

    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to update source:', error);
    sourceToast.updateError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function deleteSourceAction(id: number) {
  try {
    await deleteSource(id);

    revalidatePath('/sources');
    sourceToast.deleted();

    return { success: true };
  } catch (error) {
    console.error('Failed to delete source:', error);
    sourceToast.deleteError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function bulkDeleteSourceAction(ids: number[]) {
  try {
    const results = await Promise.allSettled(ids.map((id) => deleteSource(id)));

    const successCount = results.filter((r) => r.status === 'fulfilled').length;
    const errorCount = results.filter((r) => r.status === 'rejected').length;

    revalidatePath('/sources');

    if (errorCount === 0) {
      sourceToast.bulkDeleted(successCount);
    } else if (successCount > 0) {
      toast.warning(`${successCount} deleted, ${errorCount} failed`);
    } else {
      sourceToast.bulkDeleteError();
    }

    return { success: errorCount === 0, successCount, errorCount };
  } catch (error) {
    console.error('Bulk delete failed:', error);
    sourceToast.bulkDeleteError(error?.message);
    return { success: false, error: error?.message };
  }
}
