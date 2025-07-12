"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { toast } from "sonner";
import { meetingReminderToast } from "@/app/(protected)/(features)/meeting-reminders/components/meeting-reminder-toast";

export async function createMeetingReminderAction(formData: FormData) {
  try {
    // Process form data and create entity
    const result = await createMeetingReminder(formData);
    
    revalidatePath("/meeting-reminders");
    meetingReminderToast.created();
    
    return { success: true, data: result };
  } catch (error) {
    console.error("Failed to create meetingreminder:", error);
    meetingReminderToast.createError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function updateMeetingReminderAction(id: number, formData: FormData) {
  try {
    const result = await updateMeetingReminder(id, formData);
    
    revalidatePath("/meeting-reminders");
    revalidatePath(`/meeting-reminders/${id}`);
    meetingReminderToast.updated();
    
    return { success: true, data: result };
  } catch (error) {
    console.error("Failed to update meetingreminder:", error);
    meetingReminderToast.updateError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function deleteMeetingReminderAction(id: number) {
  try {
    await deleteMeetingReminder(id);
    
    revalidatePath("/meeting-reminders");
    meetingReminderToast.deleted();
    
    return { success: true };
  } catch (error) {
    console.error("Failed to delete meetingreminder:", error);
    meetingReminderToast.deleteError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function bulkDeleteMeetingReminderAction(ids: number[]) {
  try {
    const results = await Promise.allSettled(
      ids.map(id => deleteMeetingReminder(id))
    );
    
    const successCount = results.filter(r => r.status === 'fulfilled').length;
    const errorCount = results.filter(r => r.status === 'rejected').length;
    
    revalidatePath("/meeting-reminders");
    
    if (errorCount === 0) {
      meetingReminderToast.bulkDeleted(successCount);
    } else if (successCount > 0) {
      toast.warning(`${successCount} deleted, ${errorCount} failed`);
    } else {
      meetingReminderToast.bulkDeleteError();
    }
    
    return { success: errorCount === 0, successCount, errorCount };
  } catch (error) {
    console.error("Bulk delete failed:", error);
    meetingReminderToast.bulkDeleteError(error?.message);
    return { success: false, error: error?.message };
  }
}
