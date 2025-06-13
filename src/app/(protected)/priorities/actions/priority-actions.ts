"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { toast } from "sonner";
import { priorityToast } from "../components/priority-toast";

export async function createPriorityAction(formData: FormData) {
  try {
    // Process form data and create entity
    const result = await createPriority(formData);
    
    revalidatePath("/priorities");
    priorityToast.created();
    
    return { success: true, data: result };
  } catch (error) {
    console.error("Failed to create priority:", error);
    priorityToast.createError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function updatePriorityAction(id: number, formData: FormData) {
  try {
    const result = await updatePriority(id, formData);
    
    revalidatePath("/priorities");
    revalidatePath(`/priorities/${id}`);
    priorityToast.updated();
    
    return { success: true, data: result };
  } catch (error) {
    console.error("Failed to update priority:", error);
    priorityToast.updateError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function deletePriorityAction(id: number) {
  try {
    await deletePriority(id);
    
    revalidatePath("/priorities");
    priorityToast.deleted();
    
    return { success: true };
  } catch (error) {
    console.error("Failed to delete priority:", error);
    priorityToast.deleteError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function bulkDeletePriorityAction(ids: number[]) {
  try {
    const results = await Promise.allSettled(
      ids.map(id => deletePriority(id))
    );
    
    const successCount = results.filter(r => r.status === 'fulfilled').length;
    const errorCount = results.filter(r => r.status === 'rejected').length;
    
    revalidatePath("/priorities");
    
    if (errorCount === 0) {
      priorityToast.bulkDeleted(successCount);
    } else if (successCount > 0) {
      toast.warning(`${successCount} deleted, ${errorCount} failed`);
    } else {
      priorityToast.bulkDeleteError();
    }
    
    return { success: errorCount === 0, successCount, errorCount };
  } catch (error) {
    console.error("Bulk delete failed:", error);
    priorityToast.bulkDeleteError(error?.message);
    return { success: false, error: error?.message };
  }
}
