"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { toast } from "sonner";
import { roleToast } from "../components/role-toast";

export async function createRoleAction(formData: FormData) {
  try {
    // Process form data and create entity
    const result = await createRole(formData);
    
    revalidatePath("/roles");
    roleToast.created();
    
    return { success: true, data: result };
  } catch (error) {
    console.error("Failed to create role:", error);
    roleToast.createError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function updateRoleAction(id: number, formData: FormData) {
  try {
    const result = await updateRole(id, formData);
    
    revalidatePath("/roles");
    revalidatePath(`/roles/${id}`);
    roleToast.updated();
    
    return { success: true, data: result };
  } catch (error) {
    console.error("Failed to update role:", error);
    roleToast.updateError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function deleteRoleAction(id: number) {
  try {
    await deleteRole(id);
    
    revalidatePath("/roles");
    roleToast.deleted();
    
    return { success: true };
  } catch (error) {
    console.error("Failed to delete role:", error);
    roleToast.deleteError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function bulkDeleteRoleAction(ids: number[]) {
  try {
    const results = await Promise.allSettled(
      ids.map(id => deleteRole(id))
    );
    
    const successCount = results.filter(r => r.status === 'fulfilled').length;
    const errorCount = results.filter(r => r.status === 'rejected').length;
    
    revalidatePath("/roles");
    
    if (errorCount === 0) {
      roleToast.bulkDeleted(successCount);
    } else if (successCount > 0) {
      toast.warning(`${successCount} deleted, ${errorCount} failed`);
    } else {
      roleToast.bulkDeleteError();
    }
    
    return { success: errorCount === 0, successCount, errorCount };
  } catch (error) {
    console.error("Bulk delete failed:", error);
    roleToast.bulkDeleteError(error?.message);
    return { success: false, error: error?.message };
  }
}
