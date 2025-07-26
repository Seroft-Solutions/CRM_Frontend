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
  createArea,
  updateArea, 
  deleteArea 
} from "@/core/api/generated/spring/endpoints/area-resource/area-resource.gen";
import { areaToast } from "../components/area-toast";

export async function createAreaAction(data: any) {
  try {
    // Create entity using the generated API function
    const result = await createArea(data);
    
    revalidatePath("/areas");
    areaToast.created();
    
    return { success: true, data: result };
  } catch (error) {
    console.error("Failed to create area:", error);
    areaToast.createError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function updateAreaAction(id: number, data: any) {
  try {
    // Update entity using the generated API function with correct signature
    const result = await updateArea(id, data);
    
    revalidatePath("/areas");
    revalidatePath(`/areas/${id}`);
    areaToast.updated();
    
    return { success: true, data: result };
  } catch (error) {
    console.error("Failed to update area:", error);
    areaToast.updateError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function deleteAreaAction(id: number) {
  try {
    await deleteArea(id);
    
    revalidatePath("/areas");
    areaToast.deleted();
    
    return { success: true };
  } catch (error) {
    console.error("Failed to delete area:", error);
    areaToast.deleteError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function bulkDeleteAreaAction(ids: number[]) {
  try {
    const results = await Promise.allSettled(
      ids.map(id => deleteArea(id))
    );
    
    const successCount = results.filter(r => r.status === 'fulfilled').length;
    const errorCount = results.filter(r => r.status === 'rejected').length;
    
    revalidatePath("/areas");
    
    if (errorCount === 0) {
      areaToast.bulkDeleted(successCount);
    } else {
      areaToast.bulkDeleteError();
    }
    
    return { success: errorCount === 0, successCount, errorCount };
  } catch (error) {
    console.error("Bulk delete failed:", error);
    areaToast.bulkDeleteError(error?.message);
    return { success: false, error: error?.message };
  }
}
