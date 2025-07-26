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
  createRole,
  updateRole, 
  deleteRole 
} from "@/core/api/generated/spring/endpoints/role-resource/role-resource.gen";
import { roleToast } from "../components/role-toast";

export async function createRoleAction(data: any) {
  try {
    // Create entity using the generated API function
    const result = await createRole(data);
    
    revalidatePath("/roles");
    roleToast.created();
    
    return { success: true, data: result };
  } catch (error) {
    console.error("Failed to create role:", error);
    roleToast.createError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function updateRoleAction(id: number, data: any) {
  try {
    // Update entity using the generated API function with correct signature
    const result = await updateRole(id, data);
    
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
