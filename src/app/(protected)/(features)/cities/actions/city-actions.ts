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
  createCity,
  updateCity, 
  deleteCity 
} from "@/core/api/generated/spring/endpoints/city-resource/city-resource.gen";
import { cityToast } from "@/app/(protected)/(features)/cities/components/city-toast";

export async function createCityAction(data: any) {
  try {
    // Create entity using the generated API function
    const result = await createCity(data);
    
    // Revalidate both the main list page and any related pages
    revalidatePath("/cities");
    revalidatePath("/cities/new");
    cityToast.created();
    
    return { success: true, data: result };
  } catch (error) {
    console.error("Failed to create city:", error);
    cityToast.createError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function updateCityAction(id: number, data: any) {
  try {
    // Update entity using the generated API function with correct signature
    const result = await updateCity(id, data);
    
    // Revalidate all related paths to ensure fresh data
    revalidatePath("/cities");
    revalidatePath(`/cities/${id}`);
    revalidatePath(`/cities/${id}/edit`);
    cityToast.updated();
    
    return { success: true, data: result };
  } catch (error) {
    console.error("Failed to update city:", error);
    cityToast.updateError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function deleteCityAction(id: number) {
  try {
    await deleteCity(id);
    
    revalidatePath("/cities");
    cityToast.deleted();
    
    return { success: true };
  } catch (error) {
    console.error("Failed to delete city:", error);
    cityToast.deleteError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function bulkDeleteCityAction(ids: number[]) {
  try {
    const results = await Promise.allSettled(
      ids.map(id => deleteCity(id))
    );
    
    const successCount = results.filter(r => r.status === 'fulfilled').length;
    const errorCount = results.filter(r => r.status === 'rejected').length;
    
    // Revalidate to ensure table reflects deletions
    revalidatePath("/cities");
    
    if (errorCount === 0) {
      cityToast.bulkDeleted(successCount);
    } else {
      cityToast.bulkDeleteError();
    }
    
    return { success: errorCount === 0, successCount, errorCount };
  } catch (error) {
    console.error("Bulk delete failed:", error);
    cityToast.bulkDeleteError(error?.message);
    return { success: false, error: error?.message };
  }
}
