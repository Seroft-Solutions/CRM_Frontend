"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { toast } from "sonner";
import { subCallTypeToast } from "@/app/(protected)/(features)/sub-call-types/components/sub-call-type-toast";

export async function createSubCallTypeAction(formData: FormData) {
  try {
    // Process form data and create entity
    const result = await createSubCallType(formData);
    
    revalidatePath("/sub-call-types");
    subCallTypeToast.created();
    
    return { success: true, data: result };
  } catch (error) {
    console.error("Failed to create subcalltype:", error);
    subCallTypeToast.createError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function updateSubCallTypeAction(id: number, formData: FormData) {
  try {
    const result = await updateSubCallType(id, formData);
    
    revalidatePath("/sub-call-types");
    revalidatePath(`/sub-call-types/${id}`);
    subCallTypeToast.updated();
    
    return { success: true, data: result };
  } catch (error) {
    console.error("Failed to update subcalltype:", error);
    subCallTypeToast.updateError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function deleteSubCallTypeAction(id: number) {
  try {
    await deleteSubCallType(id);
    
    revalidatePath("/sub-call-types");
    subCallTypeToast.deleted();
    
    return { success: true };
  } catch (error) {
    console.error("Failed to delete subcalltype:", error);
    subCallTypeToast.deleteError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function bulkDeleteSubCallTypeAction(ids: number[]) {
  try {
    const results = await Promise.allSettled(
      ids.map(id => deleteSubCallType(id))
    );
    
    const successCount = results.filter(r => r.status === 'fulfilled').length;
    const errorCount = results.filter(r => r.status === 'rejected').length;
    
    revalidatePath("/sub-call-types");
    
    if (errorCount === 0) {
      subCallTypeToast.bulkDeleted(successCount);
    } else if (successCount > 0) {
      toast.warning(`${successCount} deleted, ${errorCount} failed`);
    } else {
      subCallTypeToast.bulkDeleteError();
    }
    
    return { success: errorCount === 0, successCount, errorCount };
  } catch (error) {
    console.error("Bulk delete failed:", error);
    subCallTypeToast.bulkDeleteError(error?.message);
    return { success: false, error: error?.message };
  }
}
