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
  createGroup,
  updateGroup, 
  deleteGroup 
} from "@/core/api/generated/spring/endpoints/group-resource/group-resource.gen";
import { groupToast } from "../components/group-toast";

export async function createGroupAction(data: any) {
  try {
    // Create entity using the generated API function
    const result = await createGroup(data);
    
    // Revalidate both the main list page and any related pages
    revalidatePath("/groups");
    revalidatePath("/groups/new");
    groupToast.created();
    
    return { success: true, data: result };
  } catch (error) {
    console.error("Failed to create group:", error);
    groupToast.createError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function updateGroupAction(id: number, data: any) {
  try {
    // Update entity using the generated API function with correct signature
    const result = await updateGroup(id, data);
    
    // Revalidate all related paths to ensure fresh data
    revalidatePath("/groups");
    revalidatePath(`/groups/${id}`);
    revalidatePath(`/groups/${id}/edit`);
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
    
    // Revalidate to ensure table reflects deletions
    revalidatePath("/groups");
    
    if (errorCount === 0) {
      groupToast.bulkDeleted(successCount);
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
