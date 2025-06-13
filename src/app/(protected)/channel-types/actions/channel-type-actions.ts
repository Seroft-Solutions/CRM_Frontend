"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { toast } from "sonner";
import { channelTypeToast } from "../components/channel-type-toast";

export async function createChannelTypeAction(formData: FormData) {
  try {
    // Process form data and create entity
    const result = await createChannelType(formData);
    
    revalidatePath("/channel-types");
    channelTypeToast.created();
    
    return { success: true, data: result };
  } catch (error) {
    console.error("Failed to create channeltype:", error);
    channelTypeToast.createError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function updateChannelTypeAction(id: number, formData: FormData) {
  try {
    const result = await updateChannelType(id, formData);
    
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
    } else if (successCount > 0) {
      toast.warning(`${successCount} deleted, ${errorCount} failed`);
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
