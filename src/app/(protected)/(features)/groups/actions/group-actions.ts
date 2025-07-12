"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { toast } from "sonner";
import { groupToast } from "@/app/(protected)/(features)/groups/components/group-toast";

export async function createGroupAction(formData: FormData) {
  try {
    // Process form data and create entity
    const result = await createGroup(formData);
    
    revalidatePath("/groups");
    groupToast.created();
    
    return { success: true, data: result };
  } catch (error) {
    console.error("Failed to create group:", error);
    groupToast.createError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function updateGroupAction(id: number, formData: FormData) {
  try {
    const result = await updateGroup(id, formData);
    
    revalidatePath("/groups");
    revalidatePath(`/groups/${id}`);
    groupToast.updated();
    
    return { success: true, data: result };
  } catch (error) {
    console.error("Failed to update group:", error);
    groupToast.updateError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function deleteGroupAction(id: number) {
  try {
    await deleteGroup(id);
    
    revalidatePath("/groups");
    groupToast.deleted();
    
    return { success: true };
  } catch (error) {
    console.error("Failed to delete group:", error);
    groupToast.deleteError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function bulkDeleteGroupAction(ids: number[]) {
  try {
    const results = await Promise.allSettled(
      ids.map(id => deleteGroup(id))
    );
    
    const successCount = results.filter(r => r.status === 'fulfilled').length;
    const errorCount = results.filter(r => r.status === 'rejected').length;
    
    revalidatePath("/groups");
    
    if (errorCount === 0) {
      groupToast.bulkDeleted(successCount);
    } else if (successCount > 0) {
      toast.warning(`${successCount} deleted, ${errorCount} failed`);
    } else {
      groupToast.bulkDeleteError();
    }
    
    return { success: errorCount === 0, successCount, errorCount };
  } catch (error) {
    console.error("Bulk delete failed:", error);
    groupToast.bulkDeleteError(error?.message);
    return { success: false, error: error?.message };
  }
}
