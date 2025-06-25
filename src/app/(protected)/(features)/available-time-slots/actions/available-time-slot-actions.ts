"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { toast } from "sonner";
import { availableTimeSlotToast } from "../components/available-time-slot-toast";

export async function createAvailableTimeSlotAction(formData: FormData) {
  try {
    // Process form data and create entity
    const result = await createAvailableTimeSlot(formData);
    
    revalidatePath("/available-time-slots");
    availableTimeSlotToast.created();
    
    return { success: true, data: result };
  } catch (error) {
    console.error("Failed to create availabletimeslot:", error);
    availableTimeSlotToast.createError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function updateAvailableTimeSlotAction(id: number, formData: FormData) {
  try {
    const result = await updateAvailableTimeSlot(id, formData);
    
    revalidatePath("/available-time-slots");
    revalidatePath(`/available-time-slots/${id}`);
    availableTimeSlotToast.updated();
    
    return { success: true, data: result };
  } catch (error) {
    console.error("Failed to update availabletimeslot:", error);
    availableTimeSlotToast.updateError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function deleteAvailableTimeSlotAction(id: number) {
  try {
    await deleteAvailableTimeSlot(id);
    
    revalidatePath("/available-time-slots");
    availableTimeSlotToast.deleted();
    
    return { success: true };
  } catch (error) {
    console.error("Failed to delete availabletimeslot:", error);
    availableTimeSlotToast.deleteError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function bulkDeleteAvailableTimeSlotAction(ids: number[]) {
  try {
    const results = await Promise.allSettled(
      ids.map(id => deleteAvailableTimeSlot(id))
    );
    
    const successCount = results.filter(r => r.status === 'fulfilled').length;
    const errorCount = results.filter(r => r.status === 'rejected').length;
    
    revalidatePath("/available-time-slots");
    
    if (errorCount === 0) {
      availableTimeSlotToast.bulkDeleted(successCount);
    } else if (successCount > 0) {
      toast.warning(`${successCount} deleted, ${errorCount} failed`);
    } else {
      availableTimeSlotToast.bulkDeleteError();
    }
    
    return { success: errorCount === 0, successCount, errorCount };
  } catch (error) {
    console.error("Bulk delete failed:", error);
    availableTimeSlotToast.bulkDeleteError(error?.message);
    return { success: false, error: error?.message };
  }
}
