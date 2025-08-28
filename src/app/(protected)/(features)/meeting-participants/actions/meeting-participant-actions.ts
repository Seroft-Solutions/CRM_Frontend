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
  createMeetingParticipant,
  updateMeetingParticipant,
} from '@/core/api/generated/spring/endpoints/meeting-participant-resource/meeting-participant-resource.gen';
import { MeetingParticipantDTOStatus } from '@/core/api/generated/spring/schemas/MeetingParticipantDTOStatus';
import { meetingParticipantToast } from '../components/meeting-participant-toast';

export async function createMeetingParticipantAction(data: any) {
  try {
    // Create entity using the generated API function
    const result = await createMeetingParticipant(data);

    // Revalidate both the main list page and any related pages
    revalidatePath('/meeting-participants');
    revalidatePath('/meeting-participants/new');
    meetingParticipantToast.created();

    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to create meetingparticipant:', error);
    meetingParticipantToast.createError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function updateMeetingParticipantAction(id: number, data: any) {
  try {
    // Update entity using the generated API function with correct signature
    const result = await updateMeetingParticipant(id, data);

    // Revalidate all related paths to ensure fresh data
    revalidatePath('/meeting-participants');
    revalidatePath(`/meeting-participants/${id}`);
    revalidatePath(`/meeting-participants/${id}/edit`);
    meetingParticipantToast.updated();

    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to update meetingparticipant:', error);
    meetingParticipantToast.updateError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function archiveMeetingParticipantAction(id: number, entityData: any) {
  try {
    const archivedEntity = {
      ...entityData,
      status: MeetingParticipantDTOStatus.ARCHIVED,
    };

    const result = await updateMeetingParticipant(id, archivedEntity);

    revalidatePath('/meeting-participants');
    meetingParticipantToast.custom.success(
      'Archived Successfully',
      'MeetingParticipant has been archived'
    );

    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to archive meetingparticipant:', error);
    meetingParticipantToast.custom.error(
      'Archive Failed',
      error?.message || 'Could not archive meetingparticipant'
    );
    return { success: false, error: error?.message };
  }
}

export async function updateStatusMeetingParticipantAction(
  id: number,
  entityData: any,
  newStatus: string
) {
  try {
    const statusValue =
      MeetingParticipantDTOStatus[newStatus as keyof typeof MeetingParticipantDTOStatus];
    const updatedEntity = {
      ...entityData,
      status: statusValue,
    };

    const result = await updateMeetingParticipant(id, updatedEntity);

    revalidatePath('/meeting-participants');
    meetingParticipantToast.custom.success(
      'Status Updated',
      `MeetingParticipant status changed to ${newStatus.toLowerCase()}`
    );

    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to update meetingparticipant status:', error);
    meetingParticipantToast.custom.error(
      'Status Update Failed',
      error?.message || 'Could not update meetingparticipant status'
    );
    return { success: false, error: error?.message };
  }
}

export async function bulkArchiveMeetingParticipantAction(ids: number[], entitiesData: any[]) {
  try {
    const results = await Promise.allSettled(
      ids.map(async (id, index) => {
        const entityData = entitiesData[index];
        const archivedEntity = {
          ...entityData,
          status: MeetingParticipantDTOStatus.ARCHIVED,
        };
        return updateMeetingParticipant(id, archivedEntity);
      })
    );

    const successCount = results.filter((r) => r.status === 'fulfilled').length;
    const errorCount = results.filter((r) => r.status === 'rejected').length;

    // Revalidate to ensure table reflects changes
    revalidatePath('/meeting-participants');

    if (errorCount === 0) {
      meetingParticipantToast.custom.success(
        'Bulk Archive Complete',
        `${successCount} item${successCount > 1 ? 's' : ''} archived successfully`
      );
    } else {
      meetingParticipantToast.custom.warning(
        'Partial Archive',
        `${successCount} archived, ${errorCount} failed`
      );
    }

    return { success: errorCount === 0, successCount, errorCount };
  } catch (error) {
    console.error('Bulk archive failed:', error);
    meetingParticipantToast.custom.error(
      'Bulk Archive Failed',
      error?.message || 'Could not archive items'
    );
    return { success: false, error: error?.message };
  }
}

export async function bulkUpdateStatusMeetingParticipantAction(
  ids: number[],
  entitiesData: any[],
  newStatus: string
) {
  try {
    const statusValue =
      MeetingParticipantDTOStatus[newStatus as keyof typeof MeetingParticipantDTOStatus];
    const results = await Promise.allSettled(
      ids.map(async (id, index) => {
        const entityData = entitiesData[index];
        const updatedEntity = {
          ...entityData,
          status: statusValue,
        };
        return updateMeetingParticipant(id, updatedEntity);
      })
    );

    const successCount = results.filter((r) => r.status === 'fulfilled').length;
    const errorCount = results.filter((r) => r.status === 'rejected').length;

    // Revalidate to ensure table reflects changes
    revalidatePath('/meeting-participants');

    if (errorCount === 0) {
      meetingParticipantToast.custom.success(
        'Bulk Status Update Complete',
        `${successCount} item${successCount > 1 ? 's' : ''} updated to ${newStatus.toLowerCase()}`
      );
    } else {
      meetingParticipantToast.custom.warning(
        'Partial Status Update',
        `${successCount} updated, ${errorCount} failed`
      );
    }

    return { success: errorCount === 0, successCount, errorCount };
  } catch (error) {
    console.error('Bulk status update failed:', error);
    meetingParticipantToast.custom.error(
      'Bulk Status Update Failed',
      error?.message || 'Could not update status for items'
    );
    return { success: false, error: error?.message };
  }
}
