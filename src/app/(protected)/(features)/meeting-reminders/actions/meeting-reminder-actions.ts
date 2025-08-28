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
} from '@/core/api/generated/spring/endpoints/meeting-reminder-resource/meeting-reminder-resource.gen';
import { MeetingReminderDTOStatus } from '@/core/api/generated/spring/schemas/MeetingReminderDTOStatus';
import { meetingReminderToast } from '../components/meeting-reminder-toast';

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

export async function archiveMeetingReminderAction(id: number, entityData: any) {
  try {
    const archivedEntity = {
      ...entityData,
      status: MeetingReminderDTOStatus.ARCHIVED,
    };

    const result = await updateMeetingReminder(id, archivedEntity);

    revalidatePath('/meeting-reminders');
    meetingReminderToast.custom.success(
      'Archived Successfully',
      'MeetingReminder has been archived'
    );

    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to archive meetingreminder:', error);
    meetingReminderToast.custom.error(
      'Archive Failed',
      error?.message || 'Could not archive meetingreminder'
    );
    return { success: false, error: error?.message };
  }
}

export async function updateStatusMeetingReminderAction(
  id: number,
  entityData: any,
  newStatus: string
) {
  try {
    const statusValue =
      MeetingReminderDTOStatus[newStatus as keyof typeof MeetingReminderDTOStatus];
    const updatedEntity = {
      ...entityData,
      status: statusValue,
    };

    const result = await updateMeetingReminder(id, updatedEntity);

    revalidatePath('/meeting-reminders');
    meetingReminderToast.custom.success(
      'Status Updated',
      `MeetingReminder status changed to ${newStatus.toLowerCase()}`
    );

    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to update meetingreminder status:', error);
    meetingReminderToast.custom.error(
      'Status Update Failed',
      error?.message || 'Could not update meetingreminder status'
    );
    return { success: false, error: error?.message };
  }
}

export async function bulkArchiveMeetingReminderAction(ids: number[], entitiesData: any[]) {
  try {
    const results = await Promise.allSettled(
      ids.map(async (id, index) => {
        const entityData = entitiesData[index];
        const archivedEntity = {
          ...entityData,
          status: MeetingReminderDTOStatus.ARCHIVED,
        };
        return updateMeetingReminder(id, archivedEntity);
      })
    );

    const successCount = results.filter((r) => r.status === 'fulfilled').length;
    const errorCount = results.filter((r) => r.status === 'rejected').length;

    // Revalidate to ensure table reflects changes
    revalidatePath('/meeting-reminders');

    if (errorCount === 0) {
      meetingReminderToast.custom.success(
        'Bulk Archive Complete',
        `${successCount} item${successCount > 1 ? 's' : ''} archived successfully`
      );
    } else {
      meetingReminderToast.custom.warning(
        'Partial Archive',
        `${successCount} archived, ${errorCount} failed`
      );
    }

    return { success: errorCount === 0, successCount, errorCount };
  } catch (error) {
    console.error('Bulk archive failed:', error);
    meetingReminderToast.custom.error(
      'Bulk Archive Failed',
      error?.message || 'Could not archive items'
    );
    return { success: false, error: error?.message };
  }
}

export async function bulkUpdateStatusMeetingReminderAction(
  ids: number[],
  entitiesData: any[],
  newStatus: string
) {
  try {
    const statusValue =
      MeetingReminderDTOStatus[newStatus as keyof typeof MeetingReminderDTOStatus];
    const results = await Promise.allSettled(
      ids.map(async (id, index) => {
        const entityData = entitiesData[index];
        const updatedEntity = {
          ...entityData,
          status: statusValue,
        };
        return updateMeetingReminder(id, updatedEntity);
      })
    );

    const successCount = results.filter((r) => r.status === 'fulfilled').length;
    const errorCount = results.filter((r) => r.status === 'rejected').length;

    // Revalidate to ensure table reflects changes
    revalidatePath('/meeting-reminders');

    if (errorCount === 0) {
      meetingReminderToast.custom.success(
        'Bulk Status Update Complete',
        `${successCount} item${successCount > 1 ? 's' : ''} updated to ${newStatus.toLowerCase()}`
      );
    } else {
      meetingReminderToast.custom.warning(
        'Partial Status Update',
        `${successCount} updated, ${errorCount} failed`
      );
    }

    return { success: errorCount === 0, successCount, errorCount };
  } catch (error) {
    console.error('Bulk status update failed:', error);
    meetingReminderToast.custom.error(
      'Bulk Status Update Failed',
      error?.message || 'Could not update status for items'
    );
    return { success: false, error: error?.message };
  }
}
