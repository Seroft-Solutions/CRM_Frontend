"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { toast } from "sonner";
import { userProfileToast } from "@/app/(protected)/(features)/user-profiles/components/user-profile-toast";

export async function createUserProfileAction(formData: FormData) {
  try {
    // Process form data and create entity
    const result = await createUserProfile(formData);
    
    revalidatePath("/user-profiles");
    userProfileToast.created();
    
    return { success: true, data: result };
  } catch (error) {
    console.error("Failed to create userprofile:", error);
    userProfileToast.createError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function updateUserProfileAction(id: number, formData: FormData) {
  try {
    const result = await updateUserProfile(id, formData);
    
    revalidatePath("/user-profiles");
    revalidatePath(`/user-profiles/${id}`);
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
    
    revalidatePath("/user-profiles");
    
    if (errorCount === 0) {
      userProfileToast.bulkDeleted(successCount);
    } else if (successCount > 0) {
      toast.warning(`${successCount} deleted, ${errorCount} failed`);
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
