'use server';

import { revalidatePath } from 'next/cache';

import {
  createUserProfile,
  updateUserProfile,
} from '@/core/api/generated/spring/endpoints/user-profile-resource/user-profile-resource.gen';
import { UserProfileDTOStatus } from '@/core/api/generated/spring/schemas/UserProfileDTOStatus';
import { userProfileToast } from '../components/user-profile-toast';

export async function createUserProfileAction(data: any) {
  try {
    const result = await createUserProfile(data);

    revalidatePath('/user-profiles');
    revalidatePath('/user-profiles/new');
    userProfileToast.created();

    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to create userprofile:', error);
    userProfileToast.createError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function updateUserProfileAction(id: number, data: any) {
  try {
    const result = await updateUserProfile(id, data);

    revalidatePath('/user-profiles');
    revalidatePath(`/user-profiles/${id}`);
    revalidatePath(`/user-profiles/${id}/edit`);
    userProfileToast.updated();

    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to update userprofile:', error);
    userProfileToast.updateError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function archiveUserProfileAction(id: number, entityData: any) {
  try {
    const archivedEntity = {
      ...entityData,
      status: UserProfileDTOStatus.ARCHIVED,
    };

    const result = await updateUserProfile(id, archivedEntity);

    revalidatePath('/user-profiles');
    userProfileToast.custom.success('Archived Successfully', 'UserProfile has been archived');

    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to archive userprofile:', error);
    userProfileToast.custom.error(
      'Archive Failed',
      error?.message || 'Could not archive userprofile'
    );
    return { success: false, error: error?.message };
  }
}

export async function updateStatusUserProfileAction(
  id: number,
  entityData: any,
  newStatus: string
) {
  try {
    const statusValue = UserProfileDTOStatus[newStatus as keyof typeof UserProfileDTOStatus];
    const updatedEntity = {
      ...entityData,
      status: statusValue,
    };

    const result = await updateUserProfile(id, updatedEntity);

    revalidatePath('/user-profiles');
    userProfileToast.custom.success(
      'Status Updated',
      `UserProfile status changed to ${newStatus.toLowerCase()}`
    );

    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to update userprofile status:', error);
    userProfileToast.custom.error(
      'Status Update Failed',
      error?.message || 'Could not update userprofile status'
    );
    return { success: false, error: error?.message };
  }
}

export async function bulkArchiveUserProfileAction(ids: number[], entitiesData: any[]) {
  try {
    const results = await Promise.allSettled(
      ids.map(async (id, index) => {
        const entityData = entitiesData[index];
        const archivedEntity = {
          ...entityData,
          status: UserProfileDTOStatus.ARCHIVED,
        };
        return updateUserProfile(id, archivedEntity);
      })
    );

    const successCount = results.filter((r) => r.status === 'fulfilled').length;
    const errorCount = results.filter((r) => r.status === 'rejected').length;

    revalidatePath('/user-profiles');

    if (errorCount === 0) {
      userProfileToast.custom.success(
        'Bulk Archive Complete',
        `${successCount} item${successCount > 1 ? 's' : ''} archived successfully`
      );
    } else {
      userProfileToast.custom.warning(
        'Partial Archive',
        `${successCount} archived, ${errorCount} failed`
      );
    }

    return { success: errorCount === 0, successCount, errorCount };
  } catch (error) {
    console.error('Bulk archive failed:', error);
    userProfileToast.custom.error(
      'Bulk Archive Failed',
      error?.message || 'Could not archive items'
    );
    return { success: false, error: error?.message };
  }
}

export async function bulkUpdateStatusUserProfileAction(
  ids: number[],
  entitiesData: any[],
  newStatus: string
) {
  try {
    const statusValue = UserProfileDTOStatus[newStatus as keyof typeof UserProfileDTOStatus];
    const results = await Promise.allSettled(
      ids.map(async (id, index) => {
        const entityData = entitiesData[index];
        const updatedEntity = {
          ...entityData,
          status: statusValue,
        };
        return updateUserProfile(id, updatedEntity);
      })
    );

    const successCount = results.filter((r) => r.status === 'fulfilled').length;
    const errorCount = results.filter((r) => r.status === 'rejected').length;

    revalidatePath('/user-profiles');

    if (errorCount === 0) {
      userProfileToast.custom.success(
        'Bulk Status Update Complete',
        `${successCount} item${successCount > 1 ? 's' : ''} updated to ${newStatus.toLowerCase()}`
      );
    } else {
      userProfileToast.custom.warning(
        'Partial Status Update',
        `${successCount} updated, ${errorCount} failed`
      );
    }

    return { success: errorCount === 0, successCount, errorCount };
  } catch (error) {
    console.error('Bulk status update failed:', error);
    userProfileToast.custom.error(
      'Bulk Status Update Failed',
      error?.message || 'Could not update status for items'
    );
    return { success: false, error: error?.message };
  }
}
