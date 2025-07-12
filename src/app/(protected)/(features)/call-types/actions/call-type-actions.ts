"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { toast } from "sonner";
import { callTypeToast } from "@/app/(protected)/(features)/call-types/components/call-type-toast";

export async function createCallTypeAction(formData: FormData) {
  try {
    // Process form data and create entity
    const result = await createCallType(formData);
    
    revalidatePath("/call-types");
    callTypeToast.created();
    
    return { success: true, data: result };
  } catch (error) {
    console.error("Failed to create calltype:", error);
    callTypeToast.createError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function updateCallTypeAction(id: number, formData: FormData) {
  try {
    const result = await updateCallType(id, formData);
    
    revalidatePath("/call-types");
    revalidatePath(`/call-types/${id}`);
    callTypeToast.updated();
    
    return { success: true, data: result };
  } catch (error) {
    console.error("Failed to update calltype:", error);
    callTypeToast.updateError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function deleteCallTypeAction(id: number) {
  try {
    await deleteCallType(id);
    
    revalidatePath("/call-types");
    callTypeToast.deleted();
    
    return { success: true };
  } catch (error) {
    console.error("Failed to delete calltype:", error);
    callTypeToast.deleteError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function bulkDeleteCallTypeAction(ids: number[]) {
  try {
    const results = await Promise.allSettled(
      ids.map(id => deleteCallType(id))
    );
    
    const successCount = results.filter(r => r.status === 'fulfilled').length;
    const errorCount = results.filter(r => r.status === 'rejected').length;
    
    revalidatePath("/call-types");
    
    if (errorCount === 0) {
      callTypeToast.bulkDeleted(successCount);
    } else if (successCount > 0) {
      toast.warning(`${successCount} deleted, ${errorCount} failed`);
    } else {
      callTypeToast.bulkDeleteError();
    }
    
    return { success: errorCount === 0, successCount, errorCount };
  } catch (error) {
    console.error("Bulk delete failed:", error);
    callTypeToast.bulkDeleteError(error?.message);
    return { success: false, error: error?.message };
  }
}
