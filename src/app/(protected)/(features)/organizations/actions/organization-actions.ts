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
  createOrganization,
  updateOrganization,
} from '@/core/api/generated/spring/endpoints/organization-resource/organization-resource.gen';
import { OrganizationDTOStatus } from '@/core/api/generated/spring/schemas/OrganizationDTOStatus';
import { organizationToast } from '../components/organization-toast';

export async function createOrganizationAction(data: any) {
  try {
    // Create entity using the generated API function
    const result = await createOrganization(data);

    // Revalidate both the main list page and any related pages
    revalidatePath('/organizations');
    revalidatePath('/organizations/new');
    organizationToast.created();

    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to create organization:', error);
    organizationToast.createError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function updateOrganizationAction(id: number, data: any) {
  try {
    // Update entity using the generated API function with correct signature
    const result = await updateOrganization(id, data);

    // Revalidate all related paths to ensure fresh data
    revalidatePath('/organizations');
    revalidatePath(`/organizations/${id}`);
    revalidatePath(`/organizations/${id}/edit`);
    organizationToast.updated();

    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to update organization:', error);
    organizationToast.updateError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function archiveOrganizationAction(id: number, entityData: any) {
  try {
    const archivedEntity = {
      ...entityData,
      status: OrganizationDTOStatus.ARCHIVED,
    };

    const result = await updateOrganization(id, archivedEntity);

    revalidatePath('/organizations');
    organizationToast.custom.success('Archived Successfully', 'Organization has been archived');

    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to archive organization:', error);
    organizationToast.custom.error(
      'Archive Failed',
      error?.message || 'Could not archive organization'
    );
    return { success: false, error: error?.message };
  }
}

export async function updateStatusOrganizationAction(
  id: number,
  entityData: any,
  newStatus: string
) {
  try {
    const statusValue = OrganizationDTOStatus[newStatus as keyof typeof OrganizationDTOStatus];
    const updatedEntity = {
      ...entityData,
      status: statusValue,
    };

    const result = await updateOrganization(id, updatedEntity);

    revalidatePath('/organizations');
    organizationToast.custom.success(
      'Status Updated',
      `Organization status changed to ${newStatus.toLowerCase()}`
    );

    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to update organization status:', error);
    organizationToast.custom.error(
      'Status Update Failed',
      error?.message || 'Could not update organization status'
    );
    return { success: false, error: error?.message };
  }
}

export async function bulkArchiveOrganizationAction(ids: number[], entitiesData: any[]) {
  try {
    const results = await Promise.allSettled(
      ids.map(async (id, index) => {
        const entityData = entitiesData[index];
        const archivedEntity = {
          ...entityData,
          status: OrganizationDTOStatus.ARCHIVED,
        };
        return updateOrganization(id, archivedEntity);
      })
    );

    const successCount = results.filter((r) => r.status === 'fulfilled').length;
    const errorCount = results.filter((r) => r.status === 'rejected').length;

    // Revalidate to ensure table reflects changes
    revalidatePath('/organizations');

    if (errorCount === 0) {
      organizationToast.custom.success(
        'Bulk Archive Complete',
        `${successCount} item${successCount > 1 ? 's' : ''} archived successfully`
      );
    } else {
      organizationToast.custom.warning(
        'Partial Archive',
        `${successCount} archived, ${errorCount} failed`
      );
    }

    return { success: errorCount === 0, successCount, errorCount };
  } catch (error) {
    console.error('Bulk archive failed:', error);
    organizationToast.custom.error(
      'Bulk Archive Failed',
      error?.message || 'Could not archive items'
    );
    return { success: false, error: error?.message };
  }
}

export async function bulkUpdateStatusOrganizationAction(
  ids: number[],
  entitiesData: any[],
  newStatus: string
) {
  try {
    const statusValue = OrganizationDTOStatus[newStatus as keyof typeof OrganizationDTOStatus];
    const results = await Promise.allSettled(
      ids.map(async (id, index) => {
        const entityData = entitiesData[index];
        const updatedEntity = {
          ...entityData,
          status: statusValue,
        };
        return updateOrganization(id, updatedEntity);
      })
    );

    const successCount = results.filter((r) => r.status === 'fulfilled').length;
    const errorCount = results.filter((r) => r.status === 'rejected').length;

    // Revalidate to ensure table reflects changes
    revalidatePath('/organizations');

    if (errorCount === 0) {
      organizationToast.custom.success(
        'Bulk Status Update Complete',
        `${successCount} item${successCount > 1 ? 's' : ''} updated to ${newStatus.toLowerCase()}`
      );
    } else {
      organizationToast.custom.warning(
        'Partial Status Update',
        `${successCount} updated, ${errorCount} failed`
      );
    }

    return { success: errorCount === 0, successCount, errorCount };
  } catch (error) {
    console.error('Bulk status update failed:', error);
    organizationToast.custom.error(
      'Bulk Status Update Failed',
      error?.message || 'Could not update status for items'
    );
    return { success: false, error: error?.message };
  }
}
