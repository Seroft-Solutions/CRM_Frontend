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
  createCall,
  updateCall, 
  deleteCall 
} from "@/core/api/generated/spring/endpoints/call-resource/call-resource.gen";
import { callToast } from "../components/call-toast";

export async function createCallAction(data: any) {
  try {
    // Create entity using the generated API function
    const result = await createCall(data);
    
    revalidatePath("/calls");
    callToast.created();
    
    return { success: true, data: result };
  } catch (error) {
    console.error("Failed to create call:", error);
    callToast.createError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function updateCallAction(id: number, data: any) {
  try {
    // Update entity using the generated API function with correct signature
    const result = await updateCall(id, data);
    
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
