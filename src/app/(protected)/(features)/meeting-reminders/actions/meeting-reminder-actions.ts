// ===============================================================
// 🛑 AUTO-GENERATED FILE – DO NOT EDIT DIRECTLY 🛑
// - Source: code generation pipeline
// - To customize: use ./overrides/[filename].ts or feature-level
//   extensions (e.g., ./src/features/.../extensions/)
// - Direct edits will be overwritten on regeneration
// ===============================================================
'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
// Import the generated API functions directly
import {
  createMeetingReminder,
  updateMeetingReminder,
  deleteMeetingReminder,
} from '@/core/api/generated/spring/endpoints/meeting-reminder-resource/meeting-reminder-resource.gen';
import { meetingReminderToast } from '@/app/(protected)/(features)/meeting-reminders/components/meeting-reminder-toast';

export async function createMeetingReminderAction(data: any) {
  try {
    // Create entity using the generated API function
    const result = await createMeetingReminder(data);

    // Revalidate both the main list page and any related pages
    revalidatePath('/meeting-reminders');
    revalidatePath('/meeting-reminders/new');
    meetingReminderToast.created();

    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to create meetingreminder:', error);
    meetingReminderToast.createError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function updateMeetingReminderAction(id: number, data: any) {
  try {
    // Update entity using the generated API function with correct signature
    const result = await updateMeetingReminder(id, data);

    // Revalidate all related paths to ensure fresh data
    revalidatePath('/meeting-reminders');
    revalidatePath(`/meeting-reminders/${id}`);
    revalidatePath(`/meeting-reminders/${id}/edit`);
    meetingReminderToast.updated();

    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to update meetingreminder:', error);
    meetingReminderToast.updateError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function deleteMeetingReminderAction(id: number) {
  try {
    await deleteMeetingReminder(id);

    revalidatePath('/meeting-reminders');
    meetingReminderToast.deleted();

    return { success: true };
  } catch (error) {
    console.error('Failed to delete meetingreminder:', error);
    meetingReminderToast.deleteError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function bulkDeleteMeetingReminderAction(ids: number[]) {
  try {
    const results = await Promise.allSettled(ids.map((id) => deleteMeetingReminder(id)));

    const successCount = results.filter((r) => r.status === 'fulfilled').length;
    const errorCount = results.filter((r) => r.status === 'rejected').length;

    // Revalidate to ensure table reflects deletions
    revalidatePath('/meeting-reminders');

    if (errorCount === 0) {
      meetingReminderToast.bulkDeleted(successCount);
    } else {
      meetingReminderToast.bulkDeleteError();
    }

    return { success: errorCount === 0, successCount, errorCount };
  } catch (error) {
    console.error('Bulk delete failed:', error);
    meetingReminderToast.bulkDeleteError(error?.message);
    return { success: false, error: error?.message };
  }
}
