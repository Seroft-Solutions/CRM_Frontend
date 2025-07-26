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
  createSource,
  updateSource, 
  deleteSource 
} from "@/core/api/generated/spring/endpoints/source-resource/source-resource.gen";
import { sourceToast } from "../components/source-toast";

export async function createSourceAction(data: any) {
  try {
    // Create entity using the generated API function
    const result = await createSource(data);
    
    // Revalidate both the main list page and any related pages
    revalidatePath("/sources");
    revalidatePath("/sources/new");
    sourceToast.created();
    
    return { success: true, data: result };
  } catch (error) {
    console.error("Failed to create source:", error);
    sourceToast.createError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function updateSourceAction(id: number, data: any) {
  try {
    // Update entity using the generated API function with correct signature
    const result = await updateSource(id, data);
    
    // Revalidate all related paths to ensure fresh data
    revalidatePath("/sources");
    revalidatePath(`/sources/${id}`);
    revalidatePath(`/sources/${id}/edit`);
    sourceToast.updated();
    
    return { success: true, data: result };
  } catch (error) {
    console.error("Failed to update source:", error);
    sourceToast.updateError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function deleteSourceAction(id: number) {
  try {
    await deleteSource(id);
    
    revalidatePath("/sources");
    sourceToast.deleted();
    
    return { success: true };
  } catch (error) {
    console.error("Failed to delete source:", error);
    sourceToast.deleteError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function bulkDeleteSourceAction(ids: number[]) {
  try {
    const results = await Promise.allSettled(
      ids.map(id => deleteSource(id))
    );
    
    const successCount = results.filter(r => r.status === 'fulfilled').length;
    const errorCount = results.filter(r => r.status === 'rejected').length;
    
    // Revalidate to ensure table reflects deletions
    revalidatePath("/sources");
    
    if (errorCount === 0) {
      sourceToast.bulkDeleted(successCount);
    } else {
      sourceToast.bulkDeleteError();
    }
    
    return { success: errorCount === 0, successCount, errorCount };
  } catch (error) {
    console.error("Bulk delete failed:", error);
    sourceToast.bulkDeleteError(error?.message);
    return { success: false, error: error?.message };
  }
}
