"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { toast } from "sonner";
import { meetingParticipantToast } from "@/app/(protected)/(features)/meeting-participants/components/meeting-participant-toast";

export async function createMeetingParticipantAction(formData: FormData) {
  try {
    // Process form data and create entity
    const result = await createMeetingParticipant(formData);
    
    revalidatePath("/meeting-participants");
    meetingParticipantToast.created();
    
    return { success: true, data: result };
  } catch (error) {
    console.error("Failed to create meetingparticipant:", error);
    meetingParticipantToast.createError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function updateMeetingParticipantAction(id: number, formData: FormData) {
  try {
    const result = await updateMeetingParticipant(id, formData);
    
    revalidatePath("/meeting-participants");
    revalidatePath(`/meeting-participants/${id}`);
    meetingParticipantToast.updated();
    
    return { success: true, data: result };
  } catch (error) {
    console.error("Failed to update meetingparticipant:", error);
    meetingParticipantToast.updateError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function deleteMeetingParticipantAction(id: number) {
  try {
    await deleteMeetingParticipant(id);
    
    revalidatePath("/meeting-participants");
    meetingParticipantToast.deleted();
    
    return { success: true };
  } catch (error) {
    console.error("Failed to delete meetingparticipant:", error);
    meetingParticipantToast.deleteError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function bulkDeleteMeetingParticipantAction(ids: number[]) {
  try {
    const results = await Promise.allSettled(
      ids.map(id => deleteMeetingParticipant(id))
    );
    
    const successCount = results.filter(r => r.status === 'fulfilled').length;
    const errorCount = results.filter(r => r.status === 'rejected').length;
    
    revalidatePath("/meeting-participants");
    
    if (errorCount === 0) {
      meetingParticipantToast.bulkDeleted(successCount);
    } else if (successCount > 0) {
      toast.warning(`${successCount} deleted, ${errorCount} failed`);
    } else {
      meetingParticipantToast.bulkDeleteError();
    }
    
    return { success: errorCount === 0, successCount, errorCount };
  } catch (error) {
    console.error("Bulk delete failed:", error);
    meetingParticipantToast.bulkDeleteError(error?.message);
    return { success: false, error: error?.message };
  }
}
