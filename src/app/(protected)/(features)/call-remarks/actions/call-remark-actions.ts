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
  createCallRemark,
  updateCallRemark, 
  deleteCallRemark 
} from "@/core/api/generated/spring/endpoints/call-remark-resource/call-remark-resource.gen";
import { callRemarkToast } from "@/app/(protected)/(features)/call-remarks/components/call-remark-toast";

export async function createCallRemarkAction(data: any) {
  try {
    // Create entity using the generated API function
    const result = await createCallRemark(data);
    
    // Revalidate both the main list page and any related pages
    revalidatePath("/call-remarks");
    revalidatePath("/call-remarks/new");
    callRemarkToast.created();
    
    return { success: true, data: result };
  } catch (error) {
    console.error("Failed to create callremark:", error);
    callRemarkToast.createError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function updateCallRemarkAction(id: number, data: any) {
  try {
    // Update entity using the generated API function with correct signature
    const result = await updateCallRemark(id, data);
    
    // Revalidate all related paths to ensure fresh data
    revalidatePath("/call-remarks");
    revalidatePath(`/call-remarks/${id}`);
    revalidatePath(`/call-remarks/${id}/edit`);
    callRemarkToast.updated();
    
    return { success: true, data: result };
  } catch (error) {
    console.error("Failed to update callremark:", error);
    callRemarkToast.updateError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function deleteCallRemarkAction(id: number) {
  try {
    await deleteCallRemark(id);
    
    revalidatePath("/call-remarks");
    callRemarkToast.deleted();
    
    return { success: true };
  } catch (error) {
    console.error("Failed to delete callremark:", error);
    callRemarkToast.deleteError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function bulkDeleteCallRemarkAction(ids: number[]) {
  try {
    const results = await Promise.allSettled(
      ids.map(id => deleteCallRemark(id))
    );
    
    const successCount = results.filter(r => r.status === 'fulfilled').length;
    const errorCount = results.filter(r => r.status === 'rejected').length;
    
    // Revalidate to ensure table reflects deletions
    revalidatePath("/call-remarks");
    
    if (errorCount === 0) {
      callRemarkToast.bulkDeleted(successCount);
    } else {
      callRemarkToast.bulkDeleteError();
    }
    
    return { success: errorCount === 0, successCount, errorCount };
  } catch (error) {
    console.error("Bulk delete failed:", error);
    callRemarkToast.bulkDeleteError(error?.message);
    return { success: false, error: error?.message };
  }
}
