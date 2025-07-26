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
  createChannelType,
  updateChannelType, 
  deleteChannelType 
} from "@/core/api/generated/spring/endpoints/channel-type-resource/channel-type-resource.gen";
import { channelTypeToast } from "../components/channel-type-toast";

export async function createChannelTypeAction(data: any) {
  try {
    // Create entity using the generated API function
    const result = await createChannelType(data);
    
    revalidatePath("/channel-types");
    channelTypeToast.created();
    
    return { success: true, data: result };
  } catch (error) {
    console.error("Failed to create channeltype:", error);
    channelTypeToast.createError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function updateChannelTypeAction(id: number, data: any) {
  try {
    // Update entity using the generated API function with correct signature
    const result = await updateChannelType(id, data);
    
    revalidatePath("/channel-types");
    revalidatePath(`/channel-types/${id}`);
    channelTypeToast.updated();
    
    return { success: true, data: result };
  } catch (error) {
    console.error("Failed to update channeltype:", error);
    channelTypeToast.updateError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function deleteChannelTypeAction(id: number) {
  try {
    await deleteChannelType(id);
    
    revalidatePath("/channel-types");
    channelTypeToast.deleted();
    
    return { success: true };
  } catch (error) {
    console.error("Failed to delete channeltype:", error);
    channelTypeToast.deleteError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function bulkDeleteChannelTypeAction(ids: number[]) {
  try {
    const results = await Promise.allSettled(
      ids.map(id => deleteChannelType(id))
    );
    
    const successCount = results.filter(r => r.status === 'fulfilled').length;
    const errorCount = results.filter(r => r.status === 'rejected').length;
    
    revalidatePath("/channel-types");
    
    if (errorCount === 0) {
      channelTypeToast.bulkDeleted(successCount);
    } else {
      channelTypeToast.bulkDeleteError();
    }
    
    return { success: errorCount === 0, successCount, errorCount };
  } catch (error) {
    console.error("Bulk delete failed:", error);
    channelTypeToast.bulkDeleteError(error?.message);
    return { success: false, error: error?.message };
  }
}
