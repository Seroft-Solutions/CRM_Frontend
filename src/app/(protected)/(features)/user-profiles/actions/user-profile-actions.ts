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
  createUserProfile,
  updateUserProfile, 
  deleteUserProfile 
} from "@/core/api/generated/spring/endpoints/user-profile-resource/user-profile-resource.gen";
import { userProfileToast } from "@/app/(protected)/(features)/user-profiles/components/user-profile-toast";

export async function createUserProfileAction(data: any) {
  try {
    // Create entity using the generated API function
    const result = await createUserProfile(data);
    
    // Revalidate both the main list page and any related pages
    revalidatePath("/user-profiles");
    revalidatePath("/user-profiles/new");
    userProfileToast.created();
    
    return { success: true, data: result };
  } catch (error) {
    console.error("Failed to create userprofile:", error);
    userProfileToast.createError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function updateUserProfileAction(id: string, data: any) {
  try {
    // Update entity using the generated API function with correct signature
    const result = await updateUserProfile(id, data);
    
    // Revalidate all related paths to ensure fresh data
    revalidatePath("/user-profiles");
    revalidatePath(`/user-profiles/${id}`);
    revalidatePath(`/user-profiles/${id}/edit`);
    userProfileToast.updated();
    
    return { success: true, data: result };
  } catch (error) {
    console.error("Failed to update userprofile:", error);
    userProfileToast.updateError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function deleteUserProfileAction(id: number) {
  try {
    await deleteUserProfile(id);
    
    revalidatePath("/user-profiles");
    userProfileToast.deleted();
    
    return { success: true };
  } catch (error) {
    console.error("Failed to delete userprofile:", error);
    userProfileToast.deleteError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function bulkDeleteUserProfileAction(ids: number[]) {
  try {
    const results = await Promise.allSettled(
      ids.map(id => deleteUserProfile(id))
    );
    
    const successCount = results.filter(r => r.status === 'fulfilled').length;
    const errorCount = results.filter(r => r.status === 'rejected').length;
    
    // Revalidate to ensure table reflects deletions
    revalidatePath("/user-profiles");
    
    if (errorCount === 0) {
      userProfileToast.bulkDeleted(successCount);
    } else {
      userProfileToast.bulkDeleteError();
    }
    
    return { success: errorCount === 0, successCount, errorCount };
  } catch (error) {
    console.error("Bulk delete failed:", error);
    userProfileToast.bulkDeleteError(error?.message);
    return { success: false, error: error?.message };
  }
}
