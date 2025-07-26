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
  createState,
  updateState, 
  deleteState 
} from "@/core/api/generated/spring/endpoints/state-resource/state-resource.gen";
import { stateToast } from "../components/state-toast";

export async function createStateAction(data: any) {
  try {
    // Create entity using the generated API function
    const result = await createState(data);
    
    revalidatePath("/states");
    stateToast.created();
    
    return { success: true, data: result };
  } catch (error) {
    console.error("Failed to create state:", error);
    stateToast.createError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function updateStateAction(id: number, data: any) {
  try {
    // Update entity using the generated API function with correct signature
    const result = await updateState(id, data);
    
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
