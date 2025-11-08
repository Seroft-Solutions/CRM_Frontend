'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import {
  createAvailableTimeSlot,
  updateAvailableTimeSlot,
} from '@/core/api/generated/spring/endpoints/available-time-slot-resource/available-time-slot-resource.gen';
import { AvailableTimeSlotDTOStatus } from '@/core/api/generated/spring/schemas/AvailableTimeSlotDTOStatus';
import { availableTimeSlotToast } from '../components/available-time-slot-toast';

export async function createAvailableTimeSlotAction(data: any) {
  try {
    const result = await createAvailableTimeSlot(data);

    revalidatePath('/available-time-slots');
    revalidatePath('/available-time-slots/new');
    availableTimeSlotToast.created();

    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to create availabletimeslot:', error);
    availableTimeSlotToast.createError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function updateAvailableTimeSlotAction(id: number, data: any) {
  try {
    const result = await updateAvailableTimeSlot(id, data);

    revalidatePath('/available-time-slots');
    revalidatePath(`/available-time-slots/${id}`);
    revalidatePath(`/available-time-slots/${id}/edit`);
    availableTimeSlotToast.updated();

    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to update availabletimeslot:', error);
    availableTimeSlotToast.updateError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function archiveAvailableTimeSlotAction(id: number, entityData: any) {
  try {
    const archivedEntity = {
      ...entityData,
      status: AvailableTimeSlotDTOStatus.ARCHIVED,
    };

    const result = await updateAvailableTimeSlot(id, archivedEntity);

    revalidatePath('/available-time-slots');
    availableTimeSlotToast.custom.success(
      'Archived Successfully',
      'AvailableTimeSlot has been archived'
    );

    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to archive availabletimeslot:', error);
    availableTimeSlotToast.custom.error(
      'Archive Failed',
      error?.message || 'Could not archive availabletimeslot'
    );
    return { success: false, error: error?.message };
  }
}

export async function updateStatusAvailableTimeSlotAction(
  id: number,
  entityData: any,
  newStatus: string
) {
  try {
    const statusValue =
      AvailableTimeSlotDTOStatus[newStatus as keyof typeof AvailableTimeSlotDTOStatus];
    const updatedEntity = {
      ...entityData,
      status: statusValue,
    };

    const result = await updateAvailableTimeSlot(id, updatedEntity);

    revalidatePath('/available-time-slots');
    availableTimeSlotToast.custom.success(
      'Status Updated',
      `AvailableTimeSlot status changed to ${newStatus.toLowerCase()}`
    );

    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to update availabletimeslot status:', error);
    availableTimeSlotToast.custom.error(
      'Status Update Failed',
      error?.message || 'Could not update availabletimeslot status'
    );
    return { success: false, error: error?.message };
  }
}

export async function bulkArchiveAvailableTimeSlotAction(ids: number[], entitiesData: any[]) {
  try {
    const results = await Promise.allSettled(
      ids.map(async (id, index) => {
        const entityData = entitiesData[index];
        const archivedEntity = {
          ...entityData,
          status: AvailableTimeSlotDTOStatus.ARCHIVED,
        };
        return updateAvailableTimeSlot(id, archivedEntity);
      })
    );

    const successCount = results.filter((r) => r.status === 'fulfilled').length;
    const errorCount = results.filter((r) => r.status === 'rejected').length;

    revalidatePath('/available-time-slots');

    if (errorCount === 0) {
      availableTimeSlotToast.custom.success(
        'Bulk Archive Complete',
        `${successCount} item${successCount > 1 ? 's' : ''} archived successfully`
      );
    } else {
      availableTimeSlotToast.custom.warning(
        'Partial Archive',
        `${successCount} archived, ${errorCount} failed`
      );
    }

    return { success: errorCount === 0, successCount, errorCount };
  } catch (error) {
    console.error('Bulk archive failed:', error);
    availableTimeSlotToast.custom.error(
      'Bulk Archive Failed',
      error?.message || 'Could not archive items'
    );
    return { success: false, error: error?.message };
  }
}

export async function bulkUpdateStatusAvailableTimeSlotAction(
  ids: number[],
  entitiesData: any[],
  newStatus: string
) {
  try {
    const statusValue =
      AvailableTimeSlotDTOStatus[newStatus as keyof typeof AvailableTimeSlotDTOStatus];
    const results = await Promise.allSettled(
      ids.map(async (id, index) => {
        const entityData = entitiesData[index];
        const updatedEntity = {
          ...entityData,
          status: statusValue,
        };
        return updateAvailableTimeSlot(id, updatedEntity);
      })
    );

    const successCount = results.filter((r) => r.status === 'fulfilled').length;
    const errorCount = results.filter((r) => r.status === 'rejected').length;

    revalidatePath('/available-time-slots');

    if (errorCount === 0) {
      availableTimeSlotToast.custom.success(
        'Bulk Status Update Complete',
        `${successCount} item${successCount > 1 ? 's' : ''} updated to ${newStatus.toLowerCase()}`
      );
    } else {
      availableTimeSlotToast.custom.warning(
        'Partial Status Update',
        `${successCount} updated, ${errorCount} failed`
      );
    }

    return { success: errorCount === 0, successCount, errorCount };
  } catch (error) {
    console.error('Bulk status update failed:', error);
    availableTimeSlotToast.custom.error(
      'Bulk Status Update Failed',
      error?.message || 'Could not update status for items'
    );
    return { success: false, error: error?.message };
  }
}
