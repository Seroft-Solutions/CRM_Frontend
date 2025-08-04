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
  createOrganization,
  updateOrganization, 
  deleteOrganization 
} from "@/core/api/generated/spring/endpoints/organization-resource/organization-resource.gen";
import { organizationToast } from "@/app/(protected)/(features)/organizations/components/organization-toast";

export async function createOrganizationAction(data: any) {
  try {
    // Create entity using the generated API function
    const result = await createOrganization(data);
    
    // Revalidate both the main list page and any related pages
    revalidatePath("/organizations");
    revalidatePath("/organizations/new");
    organizationToast.created();
    
    return { success: true, data: result };
  } catch (error) {
    console.error("Failed to create organization:", error);
    organizationToast.createError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function updateOrganizationAction(id: number, data: any) {
  try {
    // Update entity using the generated API function with correct signature
    const result = await updateOrganization(id, data);
    
    // Revalidate all related paths to ensure fresh data
    revalidatePath("/organizations");
    revalidatePath(`/organizations/${id}`);
    revalidatePath(`/organizations/${id}/edit`);
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
    
    // Revalidate to ensure table reflects deletions
    revalidatePath("/organizations");
    
    if (errorCount === 0) {
      organizationToast.bulkDeleted(successCount);
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
