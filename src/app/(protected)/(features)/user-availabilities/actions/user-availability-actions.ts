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
  createUserAvailability,
  updateUserAvailability, 
  deleteUserAvailability 
} from "@/core/api/generated/spring/endpoints/user-availability-resource/user-availability-resource.gen";
import { userAvailabilityToast } from "@/app/(protected)/(features)/user-availabilities/components/user-availability-toast";

export async function createUserAvailabilityAction(data: any) {
  try {
    // Create entity using the generated API function
    const result = await createUserAvailability(data);
    
    // Revalidate both the main list page and any related pages
    revalidatePath("/user-availabilities");
    revalidatePath("/user-availabilities/new");
    userAvailabilityToast.created();
    
    return { success: true, data: result };
  } catch (error) {
    console.error("Failed to create useravailability:", error);
    userAvailabilityToast.createError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function updateUserAvailabilityAction(id: number, data: any) {
  try {
    // Update entity using the generated API function with correct signature
    const result = await updateUserAvailability(id, data);
    
    // Revalidate all related paths to ensure fresh data
    revalidatePath("/user-availabilities");
    revalidatePath(`/user-availabilities/${id}`);
    revalidatePath(`/user-availabilities/${id}/edit`);
    userAvailabilityToast.updated();
    
    return { success: true, data: result };
  } catch (error) {
    console.error("Failed to update useravailability:", error);
    userAvailabilityToast.updateError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function deleteUserAvailabilityAction(id: number) {
  try {
    await deleteUserAvailability(id);
    
    revalidatePath("/user-availabilities");
    userAvailabilityToast.deleted();
    
    return { success: true };
  } catch (error) {
    console.error("Failed to delete useravailability:", error);
    userAvailabilityToast.deleteError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function bulkDeleteUserAvailabilityAction(ids: number[]) {
  try {
    const results = await Promise.allSettled(
      ids.map(id => deleteUserAvailability(id))
    );
    
    const successCount = results.filter(r => r.status === 'fulfilled').length;
    const errorCount = results.filter(r => r.status === 'rejected').length;
    
    // Revalidate to ensure table reflects deletions
    revalidatePath("/user-availabilities");
    
    if (errorCount === 0) {
      userAvailabilityToast.bulkDeleted(successCount);
    } else {
      userAvailabilityToast.bulkDeleteError();
    }
    
    return { success: errorCount === 0, successCount, errorCount };
  } catch (error) {
    console.error("Bulk delete failed:", error);
    userAvailabilityToast.bulkDeleteError(error?.message);
    return { success: false, error: error?.message };
  }
}
