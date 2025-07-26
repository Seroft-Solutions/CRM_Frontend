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
  createSubCallType,
  updateSubCallType, 
  deleteSubCallType 
} from "@/core/api/generated/spring/endpoints/sub-call-type-resource/sub-call-type-resource.gen";
import { subCallTypeToast } from "../components/sub-call-type-toast";

export async function createSubCallTypeAction(data: any) {
  try {
    // Create entity using the generated API function
    const result = await createSubCallType(data);
    
    // Revalidate both the main list page and any related pages
    revalidatePath("/sub-call-types");
    revalidatePath("/sub-call-types/new");
    subCallTypeToast.created();
    
    return { success: true, data: result };
  } catch (error) {
    console.error("Failed to create subcalltype:", error);
    subCallTypeToast.createError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function updateSubCallTypeAction(id: number, data: any) {
  try {
    // Update entity using the generated API function with correct signature
    const result = await updateSubCallType(id, data);
    
    // Revalidate all related paths to ensure fresh data
    revalidatePath("/sub-call-types");
    revalidatePath(`/sub-call-types/${id}`);
    revalidatePath(`/sub-call-types/${id}/edit`);
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
    
    // Revalidate to ensure table reflects deletions
    revalidatePath("/sub-call-types");
    
    if (errorCount === 0) {
      subCallTypeToast.bulkDeleted(successCount);
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
