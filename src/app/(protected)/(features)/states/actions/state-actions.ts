"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { toast } from "sonner";
import { stateToast } from "@/app/(protected)/(features)/states/components/state-toast";

export async function createStateAction(formData: FormData) {
  try {
    // Process form data and create entity
    const result = await createState(formData);
    
    revalidatePath("/states");
    stateToast.created();
    
    return { success: true, data: result };
  } catch (error) {
    console.error("Failed to create state:", error);
    stateToast.createError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function updateStateAction(id: number, formData: FormData) {
  try {
    const result = await updateState(id, formData);
    
    revalidatePath("/states");
    revalidatePath(`/states/${id}`);
    stateToast.updated();
    
    return { success: true, data: result };
  } catch (error) {
    console.error("Failed to update state:", error);
    stateToast.updateError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function deleteStateAction(id: number) {
  try {
    await deleteState(id);
    
    revalidatePath("/states");
    stateToast.deleted();
    
    return { success: true };
  } catch (error) {
    console.error("Failed to delete state:", error);
    stateToast.deleteError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function bulkDeleteStateAction(ids: number[]) {
  try {
    const results = await Promise.allSettled(
      ids.map(id => deleteState(id))
    );
    
    const successCount = results.filter(r => r.status === 'fulfilled').length;
    const errorCount = results.filter(r => r.status === 'rejected').length;
    
    revalidatePath("/states");
    
    if (errorCount === 0) {
      stateToast.bulkDeleted(successCount);
    } else if (successCount > 0) {
      toast.warning(`${successCount} deleted, ${errorCount} failed`);
    } else {
      stateToast.bulkDeleteError();
    }
    
    return { success: errorCount === 0, successCount, errorCount };
  } catch (error) {
    console.error("Bulk delete failed:", error);
    stateToast.bulkDeleteError(error?.message);
    return { success: false, error: error?.message };
  }
}
