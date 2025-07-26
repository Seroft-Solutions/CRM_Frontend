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
  createMeetingParticipant,
  updateMeetingParticipant, 
  deleteMeetingParticipant 
} from "@/core/api/generated/spring/endpoints/meeting-participant-resource/meeting-participant-resource.gen";
import { meetingParticipantToast } from "../components/meeting-participant-toast";

export async function createMeetingParticipantAction(data: any) {
  try {
    // Create entity using the generated API function
    const result = await createMeetingParticipant(data);
    
    revalidatePath("/meeting-participants");
    meetingParticipantToast.created();
    
    return { success: true, data: result };
  } catch (error) {
    console.error("Failed to create meetingparticipant:", error);
    meetingParticipantToast.createError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function updateMeetingParticipantAction(id: number, data: any) {
  try {
    // Update entity using the generated API function with correct signature
    const result = await updateMeetingParticipant(id, data);
    
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
