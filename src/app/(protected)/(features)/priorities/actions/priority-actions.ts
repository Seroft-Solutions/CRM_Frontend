// ===============================================================
// 🛑 AUTO-GENERATED FILE – DO NOT EDIT DIRECTLY 🛑
// - Source: code generation pipeline
// - To customize: use ./overrides/[filename].ts or feature-level
//   extensions (e.g., ./src/features/.../extensions/)
// - Direct edits will be overwritten on regeneration
// ===============================================================
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
// Import the generated API functions directly
import { 
  createPriority,
  updatePriority, 
  deletePriority 
} from "@/core/api/generated/spring/endpoints/priority-resource/priority-resource.gen";
import { priorityToast } from "@/app/(protected)/(features)/priorities/components/priority-toast";

export async function createPriorityAction(data: any) {
  try {
    // Create entity using the generated API function
    const result = await createPriority(data);
    
    // Revalidate both the main list page and any related pages
    revalidatePath("/priorities");
    revalidatePath("/priorities/new");
    priorityToast.created();
    
    return { success: true, data: result };
  } catch (error) {
    console.error("Failed to create priority:", error);
    priorityToast.createError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function updatePriorityAction(id: number, data: any) {
  try {
    // Update entity using the generated API function with correct signature
    const result = await updatePriority(id, data);
    
    // Revalidate all related paths to ensure fresh data
    revalidatePath("/priorities");
    revalidatePath(`/priorities/${id}`);
    revalidatePath(`/priorities/${id}/edit`);
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
    
    // Revalidate to ensure table reflects deletions
    revalidatePath("/priorities");
    
    if (errorCount === 0) {
      priorityToast.bulkDeleted(successCount);
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
