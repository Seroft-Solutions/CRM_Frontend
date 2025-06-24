"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { toast } from "sonner";
import { organizationToast } from "../components/organization-toast";

export async function createOrganizationAction(formData: FormData) {
  try {
    // Process form data and create entity
    const result = await createOrganization(formData);
    
    revalidatePath("/organizations");
    organizationToast.created();
    
    return { success: true, data: result };
  } catch (error) {
    console.error("Failed to create organization:", error);
    organizationToast.createError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function updateOrganizationAction(id: number, formData: FormData) {
  try {
    const result = await updateOrganization(id, formData);
    
    revalidatePath("/organizations");
    revalidatePath(`/organizations/${id}`);
    organizationToast.updated();
    
    return { success: true, data: result };
  } catch (error) {
    console.error("Failed to update organization:", error);
    organizationToast.updateError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function deleteOrganizationAction(id: number) {
  try {
    await deleteOrganization(id);
    
    revalidatePath("/organizations");
    organizationToast.deleted();
    
    return { success: true };
  } catch (error) {
    console.error("Failed to delete organization:", error);
    organizationToast.deleteError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function bulkDeleteOrganizationAction(ids: number[]) {
  try {
    const results = await Promise.allSettled(
      ids.map(id => deleteOrganization(id))
    );
    
    const successCount = results.filter(r => r.status === 'fulfilled').length;
    const errorCount = results.filter(r => r.status === 'rejected').length;
    
    revalidatePath("/organizations");
    
    if (errorCount === 0) {
      organizationToast.bulkDeleted(successCount);
    } else if (successCount > 0) {
      toast.warning(`${successCount} deleted, ${errorCount} failed`);
    } else {
      organizationToast.bulkDeleteError();
    }
    
    return { success: errorCount === 0, successCount, errorCount };
  } catch (error) {
    console.error("Bulk delete failed:", error);
    organizationToast.bulkDeleteError(error?.message);
    return { success: false, error: error?.message };
  }
}
