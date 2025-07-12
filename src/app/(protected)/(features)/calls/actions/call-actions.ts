"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { toast } from "sonner";
import { callToast } from "@/app/(protected)/(features)/calls/components/call-toast";

export async function createCallAction(formData: FormData) {
  try {
    // Process form data and create entity
    const result = await createCall(formData);
    
    revalidatePath("/calls");
    callToast.created();
    
    return { success: true, data: result };
  } catch (error) {
    console.error("Failed to create call:", error);
    callToast.createError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function updateCallAction(id: number, formData: FormData) {
  try {
    const result = await updateCall(id, formData);
    
    revalidatePath("/calls");
    revalidatePath(`/calls/${id}`);
    callToast.updated();
    
    return { success: true, data: result };
  } catch (error) {
    console.error("Failed to update call:", error);
    callToast.updateError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function deleteCallAction(id: number) {
  try {
    await deleteCall(id);
    
    revalidatePath("/calls");
    callToast.deleted();
    
    return { success: true };
  } catch (error) {
    console.error("Failed to delete call:", error);
    callToast.deleteError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function bulkDeleteCallAction(ids: number[]) {
  try {
    const results = await Promise.allSettled(
      ids.map(id => deleteCall(id))
    );
    
    const successCount = results.filter(r => r.status === 'fulfilled').length;
    const errorCount = results.filter(r => r.status === 'rejected').length;
    
    revalidatePath("/calls");
    
    if (errorCount === 0) {
      callToast.bulkDeleted(successCount);
    } else if (successCount > 0) {
      toast.warning(`${successCount} deleted, ${errorCount} failed`);
    } else {
      callToast.bulkDeleteError();
    }
    
    return { success: errorCount === 0, successCount, errorCount };
  } catch (error) {
    console.error("Bulk delete failed:", error);
    callToast.bulkDeleteError(error?.message);
    return { success: false, error: error?.message };
  }
}
