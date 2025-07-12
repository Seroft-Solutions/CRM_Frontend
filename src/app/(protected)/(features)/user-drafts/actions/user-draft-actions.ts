"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { toast } from "sonner";
import { userDraftToast } from "@/app/(protected)/(features)/user-drafts/components/user-draft-toast";

export async function createUserDraftAction(formData: FormData) {
  try {
    // Process form data and create entity
    const result = await createUserDraft(formData);
    
    revalidatePath("/user-drafts");
    userDraftToast.created();
    
    return { success: true, data: result };
  } catch (error) {
    console.error("Failed to create userdraft:", error);
    userDraftToast.createError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function updateUserDraftAction(id: number, formData: FormData) {
  try {
    const result = await updateUserDraft(id, formData);
    
    revalidatePath("/user-drafts");
    revalidatePath(`/user-drafts/${id}`);
    userDraftToast.updated();
    
    return { success: true, data: result };
  } catch (error) {
    console.error("Failed to update userdraft:", error);
    userDraftToast.updateError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function deleteUserDraftAction(id: number) {
  try {
    await deleteUserDraft(id);
    
    revalidatePath("/user-drafts");
    userDraftToast.deleted();
    
    return { success: true };
  } catch (error) {
    console.error("Failed to delete userdraft:", error);
    userDraftToast.deleteError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function bulkDeleteUserDraftAction(ids: number[]) {
  try {
    const results = await Promise.allSettled(
      ids.map(id => deleteUserDraft(id))
    );
    
    const successCount = results.filter(r => r.status === 'fulfilled').length;
    const errorCount = results.filter(r => r.status === 'rejected').length;
    
    revalidatePath("/user-drafts");
    
    if (errorCount === 0) {
      userDraftToast.bulkDeleted(successCount);
    } else if (successCount > 0) {
      toast.warning(`${successCount} deleted, ${errorCount} failed`);
    } else {
      userDraftToast.bulkDeleteError();
    }
    
    return { success: errorCount === 0, successCount, errorCount };
  } catch (error) {
    console.error("Bulk delete failed:", error);
    userDraftToast.bulkDeleteError(error?.message);
    return { success: false, error: error?.message };
  }
}
