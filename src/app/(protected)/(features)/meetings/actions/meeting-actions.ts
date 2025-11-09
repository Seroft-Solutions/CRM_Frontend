'use server';

import { revalidatePath } from 'next/cache';

import {
  createMeeting,
  updateMeeting,
} from '@/core/api/generated/spring/endpoints/meeting-resource/meeting-resource.gen';
import { MeetingDTOStatus } from '@/core/api/generated/spring/schemas/MeetingDTOStatus';
import { meetingToast } from '../components/meeting-toast';

export async function createMeetingAction(data: any) {
  try {
    const result = await createMeeting(data);

    revalidatePath('/meetings');
    revalidatePath('/meetings/new');
    meetingToast.created();

    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to create meeting:', error);
    meetingToast.createError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function updateMeetingAction(id: number, data: any) {
  try {
    const result = await updateMeeting(id, data);

    revalidatePath('/meetings');
    revalidatePath(`/meetings/${id}`);
    revalidatePath(`/meetings/${id}/edit`);
    meetingToast.updated();

    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to update meeting:', error);
    meetingToast.updateError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function archiveMeetingAction(id: number, entityData: any) {
  try {
    const archivedEntity = {
      ...entityData,
      status: MeetingDTOStatus.ARCHIVED,
    };

    const result = await updateMeeting(id, archivedEntity);

    revalidatePath('/meetings');
    meetingToast.custom.success('Archived Successfully', 'Meeting has been archived');

    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to archive meeting:', error);
    meetingToast.custom.error('Archive Failed', error?.message || 'Could not archive meeting');
    return { success: false, error: error?.message };
  }
}

export async function updateStatusMeetingAction(id: number, entityData: any, newStatus: string) {
  try {
    const statusValue = MeetingDTOStatus[newStatus as keyof typeof MeetingDTOStatus];
    const updatedEntity = {
      ...entityData,
      status: statusValue,
    };

    const result = await updateMeeting(id, updatedEntity);

    revalidatePath('/meetings');
    meetingToast.custom.success(
      'Status Updated',
      `Meeting status changed to ${newStatus.toLowerCase()}`
    );

    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to update meeting status:', error);
    meetingToast.custom.error(
      'Status Update Failed',
      error?.message || 'Could not update meeting status'
    );
    return { success: false, error: error?.message };
  }
}

export async function bulkArchiveMeetingAction(ids: number[], entitiesData: any[]) {
  try {
    const results = await Promise.allSettled(
      ids.map(async (id, index) => {
        const entityData = entitiesData[index];
        const archivedEntity = {
          ...entityData,
          status: MeetingDTOStatus.ARCHIVED,
        };
        return updateMeeting(id, archivedEntity);
      })
    );

    const successCount = results.filter((r) => r.status === 'fulfilled').length;
    const errorCount = results.filter((r) => r.status === 'rejected').length;

    revalidatePath('/meetings');

    if (errorCount === 0) {
      meetingToast.custom.success(
        'Bulk Archive Complete',
        `${successCount} item${successCount > 1 ? 's' : ''} archived successfully`
      );
    } else {
      meetingToast.custom.warning(
        'Partial Archive',
        `${successCount} archived, ${errorCount} failed`
      );
    }

    return { success: errorCount === 0, successCount, errorCount };
  } catch (error) {
    console.error('Bulk archive failed:', error);
    meetingToast.custom.error('Bulk Archive Failed', error?.message || 'Could not archive items');
    return { success: false, error: error?.message };
  }
}

export async function bulkUpdateStatusMeetingAction(
  ids: number[],
  entitiesData: any[],
  newStatus: string
) {
  try {
    const statusValue = MeetingDTOStatus[newStatus as keyof typeof MeetingDTOStatus];
    const results = await Promise.allSettled(
      ids.map(async (id, index) => {
        const entityData = entitiesData[index];
        const updatedEntity = {
          ...entityData,
          status: statusValue,
        };
        return updateMeeting(id, updatedEntity);
      })
    );

    const successCount = results.filter((r) => r.status === 'fulfilled').length;
    const errorCount = results.filter((r) => r.status === 'rejected').length;

    revalidatePath('/meetings');

    if (errorCount === 0) {
      meetingToast.custom.success(
        'Bulk Status Update Complete',
        `${successCount} item${successCount > 1 ? 's' : ''} updated to ${newStatus.toLowerCase()}`
      );
    } else {
      meetingToast.custom.warning(
        'Partial Status Update',
        `${successCount} updated, ${errorCount} failed`
      );
    }

    return { success: errorCount === 0, successCount, errorCount };
  } catch (error) {
    console.error('Bulk status update failed:', error);
    meetingToast.custom.error(
      'Bulk Status Update Failed',
      error?.message || 'Could not update status for items'
    );
    return { success: false, error: error?.message };
  }
}
