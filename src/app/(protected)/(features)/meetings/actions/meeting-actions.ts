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
  createMeeting,
  updateMeeting, 
  deleteMeeting 
} from "@/core/api/generated/spring/endpoints/meeting-resource/meeting-resource.gen";
import { meetingToast } from "../components/meeting-toast";

export async function createMeetingAction(data: any) {
  try {
    // Create entity using the generated API function
    const result = await createMeeting(data);
    
    // Revalidate both the main list page and any related pages
    revalidatePath("/meetings");
    revalidatePath("/meetings/new");
    meetingToast.created();
    
    return { success: true, data: result };
  } catch (error) {
    console.error("Failed to create meeting:", error);
    meetingToast.createError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function updateMeetingAction(id: number, data: any) {
  try {
    // Update entity using the generated API function with correct signature
    const result = await updateMeeting(id, data);
    
    // Revalidate all related paths to ensure fresh data
    revalidatePath("/meetings");
    revalidatePath(`/meetings/${id}`);
    revalidatePath(`/meetings/${id}/edit`);
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
    
    // Revalidate to ensure table reflects deletions
    revalidatePath("/meetings");
    
    if (errorCount === 0) {
      meetingToast.bulkDeleted(successCount);
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
