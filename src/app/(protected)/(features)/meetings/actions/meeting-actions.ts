"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { toast } from "sonner";
import { meetingToast } from "@/app/(protected)/(features)/meetings/components/meeting-toast";

export async function createMeetingAction(formData: FormData) {
  try {
    // Process form data and create entity
    const result = await createMeeting(formData);
    
    revalidatePath("/meetings");
    meetingToast.created();
    
    return { success: true, data: result };
  } catch (error) {
    console.error("Failed to create meeting:", error);
    meetingToast.createError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function updateMeetingAction(id: number, formData: FormData) {
  try {
    const result = await updateMeeting(id, formData);
    
    revalidatePath("/meetings");
    revalidatePath(`/meetings/${id}`);
    meetingToast.updated();
    
    return { success: true, data: result };
  } catch (error) {
    console.error("Failed to update meeting:", error);
    meetingToast.updateError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function deleteMeetingAction(id: number) {
  try {
    await deleteMeeting(id);
    
    revalidatePath("/meetings");
    meetingToast.deleted();
    
    return { success: true };
  } catch (error) {
    console.error("Failed to delete meeting:", error);
    meetingToast.deleteError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function bulkDeleteMeetingAction(ids: number[]) {
  try {
    const results = await Promise.allSettled(
      ids.map(id => deleteMeeting(id))
    );
    
    const successCount = results.filter(r => r.status === 'fulfilled').length;
    const errorCount = results.filter(r => r.status === 'rejected').length;
    
    revalidatePath("/meetings");
    
    if (errorCount === 0) {
      meetingToast.bulkDeleted(successCount);
    } else if (successCount > 0) {
      toast.warning(`${successCount} deleted, ${errorCount} failed`);
    } else {
      meetingToast.bulkDeleteError();
    }
    
    return { success: errorCount === 0, successCount, errorCount };
  } catch (error) {
    console.error("Bulk delete failed:", error);
    meetingToast.bulkDeleteError(error?.message);
    return { success: false, error: error?.message };
  }
}
