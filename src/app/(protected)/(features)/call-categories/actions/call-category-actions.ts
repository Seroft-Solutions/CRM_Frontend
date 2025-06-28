'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { toast } from 'sonner';
import { callCategoryToast } from '../components/call-category-toast';

export async function createCallCategoryAction(formData: FormData) {
  try {
    // Process form data and create entity
    const result = await createCallCategory(formData);

    revalidatePath('/call-categories');
    callCategoryToast.created();

    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to create callcategory:', error);
    callCategoryToast.createError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function updateCallCategoryAction(id: number, formData: FormData) {
  try {
    const result = await updateCallCategory(id, formData);

    revalidatePath('/call-categories');
    revalidatePath(`/call-categories/${id}`);
    callCategoryToast.updated();

    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to update callcategory:', error);
    callCategoryToast.updateError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function deleteCallCategoryAction(id: number) {
  try {
    await deleteCallCategory(id);

    revalidatePath('/call-categories');
    callCategoryToast.deleted();

    return { success: true };
  } catch (error) {
    console.error('Failed to delete callcategory:', error);
    callCategoryToast.deleteError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function bulkDeleteCallCategoryAction(ids: number[]) {
  try {
    const results = await Promise.allSettled(ids.map((id) => deleteCallCategory(id)));

    const successCount = results.filter((r) => r.status === 'fulfilled').length;
    const errorCount = results.filter((r) => r.status === 'rejected').length;

    revalidatePath('/call-categories');

    if (errorCount === 0) {
      callCategoryToast.bulkDeleted(successCount);
    } else if (successCount > 0) {
      toast.warning(`${successCount} deleted, ${errorCount} failed`);
    } else {
      callCategoryToast.bulkDeleteError();
    }

    return { success: errorCount === 0, successCount, errorCount };
  } catch (error) {
    console.error('Bulk delete failed:', error);
    callCategoryToast.bulkDeleteError(error?.message);
    return { success: false, error: error?.message };
  }
}
