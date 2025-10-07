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
  createProductCategory,
  updateProductCategory,
} from '@/core/api/generated/spring/endpoints/product-category-resource/product-category-resource.gen';
import { ProductCategoryDTOStatus } from '@/core/api/generated/spring/schemas/ProductCategoryDTOStatus';
import { productCategoryToast } from '../components/product-category-toast';

export async function createProductCategoryAction(data: any) {
  try {
    // Create entity using the generated API function
    const result = await createProductCategory(data);

    // Revalidate both the main list page and any related pages
    revalidatePath('/product-categories');
    revalidatePath('/product-categories/new');
    productCategoryToast.created();

    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to create productcategory:', error);
    productCategoryToast.createError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function updateProductCategoryAction(id: number, data: any) {
  try {
    // Update entity using the generated API function with correct signature
    const result = await updateProductCategory(id, data);

    // Revalidate all related paths to ensure fresh data
    revalidatePath('/product-categories');
    revalidatePath(`/product-categories/${id}`);
    revalidatePath(`/product-categories/${id}/edit`);
    productCategoryToast.updated();

    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to update productcategory:', error);
    productCategoryToast.updateError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function archiveProductCategoryAction(id: number, entityData: any) {
  try {
    const archivedEntity = {
      ...entityData,
      status: ProductCategoryDTOStatus.ARCHIVED,
    };

    const result = await updateProductCategory(id, archivedEntity);

    revalidatePath('/product-categories');
    productCategoryToast.custom.success(
      'Archived Successfully',
      'ProductCategory has been archived'
    );

    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to archive productcategory:', error);
    productCategoryToast.custom.error(
      'Archive Failed',
      error?.message || 'Could not archive productcategory'
    );
    return { success: false, error: error?.message };
  }
}

export async function updateStatusProductCategoryAction(
  id: number,
  entityData: any,
  newStatus: string
) {
  try {
    const statusValue =
      ProductCategoryDTOStatus[newStatus as keyof typeof ProductCategoryDTOStatus];
    const updatedEntity = {
      ...entityData,
      status: statusValue,
    };

    const result = await updateProductCategory(id, updatedEntity);

    revalidatePath('/product-categories');
    productCategoryToast.custom.success(
      'Status Updated',
      `ProductCategory status changed to ${newStatus.toLowerCase()}`
    );

    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to update productcategory status:', error);
    productCategoryToast.custom.error(
      'Status Update Failed',
      error?.message || 'Could not update productcategory status'
    );
    return { success: false, error: error?.message };
  }
}

export async function bulkArchiveProductCategoryAction(ids: number[], entitiesData: any[]) {
  try {
    const results = await Promise.allSettled(
      ids.map(async (id, index) => {
        const entityData = entitiesData[index];
        const archivedEntity = {
          ...entityData,
          status: ProductCategoryDTOStatus.ARCHIVED,
        };
        return updateProductCategory(id, archivedEntity);
      })
    );

    const successCount = results.filter((r) => r.status === 'fulfilled').length;
    const errorCount = results.filter((r) => r.status === 'rejected').length;

    // Revalidate to ensure table reflects changes
    revalidatePath('/product-categories');

    if (errorCount === 0) {
      productCategoryToast.custom.success(
        'Bulk Archive Complete',
        `${successCount} item${successCount > 1 ? 's' : ''} archived successfully`
      );
    } else {
      productCategoryToast.custom.warning(
        'Partial Archive',
        `${successCount} archived, ${errorCount} failed`
      );
    }

    return { success: errorCount === 0, successCount, errorCount };
  } catch (error) {
    console.error('Bulk archive failed:', error);
    productCategoryToast.custom.error(
      'Bulk Archive Failed',
      error?.message || 'Could not archive items'
    );
    return { success: false, error: error?.message };
  }
}

export async function bulkUpdateStatusProductCategoryAction(
  ids: number[],
  entitiesData: any[],
  newStatus: string
) {
  try {
    const statusValue =
      ProductCategoryDTOStatus[newStatus as keyof typeof ProductCategoryDTOStatus];
    const results = await Promise.allSettled(
      ids.map(async (id, index) => {
        const entityData = entitiesData[index];
        const updatedEntity = {
          ...entityData,
          status: statusValue,
        };
        return updateProductCategory(id, updatedEntity);
      })
    );

    const successCount = results.filter((r) => r.status === 'fulfilled').length;
    const errorCount = results.filter((r) => r.status === 'rejected').length;

    // Revalidate to ensure table reflects changes
    revalidatePath('/product-categories');

    if (errorCount === 0) {
      productCategoryToast.custom.success(
        'Bulk Status Update Complete',
        `${successCount} item${successCount > 1 ? 's' : ''} updated to ${newStatus.toLowerCase()}`
      );
    } else {
      productCategoryToast.custom.warning(
        'Partial Status Update',
        `${successCount} updated, ${errorCount} failed`
      );
    }

    return { success: errorCount === 0, successCount, errorCount };
  } catch (error) {
    console.error('Bulk status update failed:', error);
    productCategoryToast.custom.error(
      'Bulk Status Update Failed',
      error?.message || 'Could not update status for items'
    );
    return { success: false, error: error?.message };
  }
}
