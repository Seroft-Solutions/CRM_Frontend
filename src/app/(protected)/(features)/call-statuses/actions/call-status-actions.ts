"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { toast } from "sonner";
import { callStatusToast } from "../components/call-status-toast";

export async function createCallStatusAction(formData: FormData) {
  try {
    // Process form data and create entity
    const result = await createCallStatus(formData);
    
    revalidatePath("/call-statuses");
    callStatusToast.created();
    
    return { success: true, data: result };
  } catch (error) {
    console.error("Failed to create callstatus:", error);
    callStatusToast.createError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function updateCallStatusAction(id: number, formData: FormData) {
  try {
    const result = await updateCallStatus(id, formData);
    
    revalidatePath("/call-statuses");
    revalidatePath(`/call-statuses/${id}`);
    callStatusToast.updated();
    
    return { success: true, data: result };
  } catch (error) {
    console.error("Failed to update callstatus:", error);
    callStatusToast.updateError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function deleteCallStatusAction(id: number) {
  try {
    await deleteCallStatus(id);
    
    revalidatePath("/call-statuses");
    callStatusToast.deleted();
    
    return { success: true };
  } catch (error) {
    console.error("Failed to delete callstatus:", error);
    callStatusToast.deleteError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function bulkDeleteCallStatusAction(ids: number[]) {
  try {
    const results = await Promise.allSettled(
      ids.map(id => deleteCallStatus(id))
    );
    
    const successCount = results.filter(r => r.status === 'fulfilled').length;
    const errorCount = results.filter(r => r.status === 'rejected').length;
    
    revalidatePath("/call-statuses");
    
    if (errorCount === 0) {
      callStatusToast.bulkDeleted(successCount);
    } else if (successCount > 0) {
      toast.warning(`${successCount} deleted, ${errorCount} failed`);
    } else {
      callStatusToast.bulkDeleteError();
    }
    
    return { success: errorCount === 0, successCount, errorCount };
  } catch (error) {
    console.error("Bulk delete failed:", error);
    callStatusToast.bulkDeleteError(error?.message);
    return { success: false, error: error?.message };
  }
}
