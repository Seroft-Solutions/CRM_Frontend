'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import {
  createChannelType,
  updateChannelType,
} from '@/core/api/generated/spring/endpoints/channel-type-resource/channel-type-resource.gen';
import { ChannelTypeDTOStatus } from '@/core/api/generated/spring/schemas/ChannelTypeDTOStatus';
import { channelTypeToast } from '../components/channel-type-toast';

export async function createChannelTypeAction(data: any) {
  try {
    const result = await createChannelType(data);

    revalidatePath('/channel-types');
    revalidatePath('/channel-types/new');
    channelTypeToast.created();

    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to create channeltype:', error);
    channelTypeToast.createError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function updateChannelTypeAction(id: number, data: any) {
  try {
    const result = await updateChannelType(id, data);

    revalidatePath('/channel-types');
    revalidatePath(`/channel-types/${id}`);
    revalidatePath(`/channel-types/${id}/edit`);
    channelTypeToast.updated();

    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to update channeltype:', error);
    channelTypeToast.updateError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function archiveChannelTypeAction(id: number, entityData: any) {
  try {
    const archivedEntity = {
      ...entityData,
      status: ChannelTypeDTOStatus.ARCHIVED,
    };

    const result = await updateChannelType(id, archivedEntity);

    revalidatePath('/channel-types');
    channelTypeToast.custom.success('Archived Successfully', 'ChannelType has been archived');

    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to archive channeltype:', error);
    channelTypeToast.custom.error(
      'Archive Failed',
      error?.message || 'Could not archive channeltype'
    );
    return { success: false, error: error?.message };
  }
}

export async function updateStatusChannelTypeAction(
  id: number,
  entityData: any,
  newStatus: string
) {
  try {
    const statusValue = ChannelTypeDTOStatus[newStatus as keyof typeof ChannelTypeDTOStatus];
    const updatedEntity = {
      ...entityData,
      status: statusValue,
    };

    const result = await updateChannelType(id, updatedEntity);

    revalidatePath('/channel-types');
    channelTypeToast.custom.success(
      'Status Updated',
      `ChannelType status changed to ${newStatus.toLowerCase()}`
    );

    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to update channeltype status:', error);
    channelTypeToast.custom.error(
      'Status Update Failed',
      error?.message || 'Could not update channeltype status'
    );
    return { success: false, error: error?.message };
  }
}

export async function bulkArchiveChannelTypeAction(ids: number[], entitiesData: any[]) {
  try {
    const results = await Promise.allSettled(
      ids.map(async (id, index) => {
        const entityData = entitiesData[index];
        const archivedEntity = {
          ...entityData,
          status: ChannelTypeDTOStatus.ARCHIVED,
        };
        return updateChannelType(id, archivedEntity);
      })
    );

    const successCount = results.filter((r) => r.status === 'fulfilled').length;
    const errorCount = results.filter((r) => r.status === 'rejected').length;

    revalidatePath('/channel-types');

    if (errorCount === 0) {
      channelTypeToast.custom.success(
        'Bulk Archive Complete',
        `${successCount} item${successCount > 1 ? 's' : ''} archived successfully`
      );
    } else {
      channelTypeToast.custom.warning(
        'Partial Archive',
        `${successCount} archived, ${errorCount} failed`
      );
    }

    return { success: errorCount === 0, successCount, errorCount };
  } catch (error) {
    console.error('Bulk archive failed:', error);
    channelTypeToast.custom.error(
      'Bulk Archive Failed',
      error?.message || 'Could not archive items'
    );
    return { success: false, error: error?.message };
  }
}

export async function bulkUpdateStatusChannelTypeAction(
  ids: number[],
  entitiesData: any[],
  newStatus: string
) {
  try {
    const statusValue = ChannelTypeDTOStatus[newStatus as keyof typeof ChannelTypeDTOStatus];
    const results = await Promise.allSettled(
      ids.map(async (id, index) => {
        const entityData = entitiesData[index];
        const updatedEntity = {
          ...entityData,
          status: statusValue,
        };
        return updateChannelType(id, updatedEntity);
      })
    );

    const successCount = results.filter((r) => r.status === 'fulfilled').length;
    const errorCount = results.filter((r) => r.status === 'rejected').length;

    revalidatePath('/channel-types');

    if (errorCount === 0) {
      channelTypeToast.custom.success(
        'Bulk Status Update Complete',
        `${successCount} item${successCount > 1 ? 's' : ''} updated to ${newStatus.toLowerCase()}`
      );
    } else {
      channelTypeToast.custom.warning(
        'Partial Status Update',
        `${successCount} updated, ${errorCount} failed`
      );
    }

    return { success: errorCount === 0, successCount, errorCount };
  } catch (error) {
    console.error('Bulk status update failed:', error);
    channelTypeToast.custom.error(
      'Bulk Status Update Failed',
      error?.message || 'Could not update status for items'
    );
    return { success: false, error: error?.message };
  }
}
