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
  createRole,
  updateRole,
} from '@/core/api/generated/spring/endpoints/role-resource/role-resource.gen';
import { RoleDTOStatus } from '@/core/api/generated/spring/schemas/RoleDTOStatus';
import { roleToast } from '../components/role-toast';

export async function createRoleAction(data: any) {
  try {
    // Create entity using the generated API function
    const result = await createRole(data);

    // Revalidate both the main list page and any related pages
    revalidatePath('/roles');
    revalidatePath('/roles/new');
    roleToast.created();

    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to create role:', error);
    roleToast.createError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function updateRoleAction(id: number, data: any) {
  try {
    // Update entity using the generated API function with correct signature
    const result = await updateRole(id, data);

    // Revalidate all related paths to ensure fresh data
    revalidatePath('/roles');
    revalidatePath(`/roles/${id}`);
    revalidatePath(`/roles/${id}/edit`);
    roleToast.updated();

    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to update role:', error);
    roleToast.updateError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function archiveRoleAction(id: number, entityData: any) {
  try {
    const archivedEntity = {
      ...entityData,
      status: RoleDTOStatus.ARCHIVED,
    };

    const result = await updateRole(id, archivedEntity);

    revalidatePath('/roles');
    roleToast.custom.success('Archived Successfully', 'Role has been archived');

    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to archive role:', error);
    roleToast.custom.error('Archive Failed', error?.message || 'Could not archive role');
    return { success: false, error: error?.message };
  }
}

export async function updateStatusRoleAction(id: number, entityData: any, newStatus: string) {
  try {
    const statusValue = RoleDTOStatus[newStatus as keyof typeof RoleDTOStatus];
    const updatedEntity = {
      ...entityData,
      status: statusValue,
    };

    const result = await updateRole(id, updatedEntity);

    revalidatePath('/roles');
    roleToast.custom.success('Status Updated', `Role status changed to ${newStatus.toLowerCase()}`);

    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to update role status:', error);
    roleToast.custom.error(
      'Status Update Failed',
      error?.message || 'Could not update role status'
    );
    return { success: false, error: error?.message };
  }
}

export async function bulkArchiveRoleAction(ids: number[], entitiesData: any[]) {
  try {
    const results = await Promise.allSettled(
      ids.map(async (id, index) => {
        const entityData = entitiesData[index];
        const archivedEntity = {
          ...entityData,
          status: RoleDTOStatus.ARCHIVED,
        };
        return updateRole(id, archivedEntity);
      })
    );

    const successCount = results.filter((r) => r.status === 'fulfilled').length;
    const errorCount = results.filter((r) => r.status === 'rejected').length;

    // Revalidate to ensure table reflects changes
    revalidatePath('/roles');

    if (errorCount === 0) {
      roleToast.custom.success(
        'Bulk Archive Complete',
        `${successCount} item${successCount > 1 ? 's' : ''} archived successfully`
      );
    } else {
      roleToast.custom.warning('Partial Archive', `${successCount} archived, ${errorCount} failed`);
    }

    return { success: errorCount === 0, successCount, errorCount };
  } catch (error) {
    console.error('Bulk archive failed:', error);
    roleToast.custom.error('Bulk Archive Failed', error?.message || 'Could not archive items');
    return { success: false, error: error?.message };
  }
}

export async function bulkUpdateStatusRoleAction(
  ids: number[],
  entitiesData: any[],
  newStatus: string
) {
  try {
    const statusValue = RoleDTOStatus[newStatus as keyof typeof RoleDTOStatus];
    const results = await Promise.allSettled(
      ids.map(async (id, index) => {
        const entityData = entitiesData[index];
        const updatedEntity = {
          ...entityData,
          status: statusValue,
        };
        return updateRole(id, updatedEntity);
      })
    );

    const successCount = results.filter((r) => r.status === 'fulfilled').length;
    const errorCount = results.filter((r) => r.status === 'rejected').length;

    // Revalidate to ensure table reflects changes
    revalidatePath('/roles');

    if (errorCount === 0) {
      roleToast.custom.success(
        'Bulk Status Update Complete',
        `${successCount} item${successCount > 1 ? 's' : ''} updated to ${newStatus.toLowerCase()}`
      );
    } else {
      roleToast.custom.warning(
        'Partial Status Update',
        `${successCount} updated, ${errorCount} failed`
      );
    }

    return { success: errorCount === 0, successCount, errorCount };
  } catch (error) {
    console.error('Bulk status update failed:', error);
    roleToast.custom.error(
      'Bulk Status Update Failed',
      error?.message || 'Could not update status for items'
    );
    return { success: false, error: error?.message };
  }
}
