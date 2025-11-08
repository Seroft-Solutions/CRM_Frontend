'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import {
  createProductSubCategory,
  updateProductSubCategory,
} from '@/core/api/generated/spring/endpoints/product-sub-category-resource/product-sub-category-resource.gen';
import { ProductSubCategoryDTOStatus } from '@/core/api/generated/spring/schemas/ProductSubCategoryDTOStatus';
import { productSubCategoryToast } from '../components/product-sub-category-toast';

export async function createProductSubCategoryAction(data: any) {
  try {
    const result = await createProductSubCategory(data);

    revalidatePath('/product-sub-categories');
    revalidatePath('/product-sub-categories/new');
    productSubCategoryToast.created();

    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to create productsubcategory:', error);
    productSubCategoryToast.createError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function updateProductSubCategoryAction(id: number, data: any) {
  try {
    const result = await updateProductSubCategory(id, data);

    revalidatePath('/product-sub-categories');
    revalidatePath(`/product-sub-categories/${id}`);
    revalidatePath(`/product-sub-categories/${id}/edit`);
    productSubCategoryToast.updated();

    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to update productsubcategory:', error);
    productSubCategoryToast.updateError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function archiveProductSubCategoryAction(id: number, entityData: any) {
  try {
    const archivedEntity = {
      ...entityData,
      status: ProductSubCategoryDTOStatus.ARCHIVED,
    };

    const result = await updateProductSubCategory(id, archivedEntity);

    revalidatePath('/product-sub-categories');
    productSubCategoryToast.custom.success(
      'Archived Successfully',
      'ProductSubCategory has been archived'
    );

    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to archive productsubcategory:', error);
    productSubCategoryToast.custom.error(
      'Archive Failed',
      error?.message || 'Could not archive productsubcategory'
    );
    return { success: false, error: error?.message };
  }
}

export async function updateStatusProductSubCategoryAction(
  id: number,
  entityData: any,
  newStatus: string
) {
  try {
    const statusValue =
      ProductSubCategoryDTOStatus[newStatus as keyof typeof ProductSubCategoryDTOStatus];
    const updatedEntity = {
      ...entityData,
      status: statusValue,
    };

    const result = await updateProductSubCategory(id, updatedEntity);

    revalidatePath('/product-sub-categories');
    productSubCategoryToast.custom.success(
      'Status Updated',
      `ProductSubCategory status changed to ${newStatus.toLowerCase()}`
    );

    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to update productsubcategory status:', error);
    productSubCategoryToast.custom.error(
      'Status Update Failed',
      error?.message || 'Could not update productsubcategory status'
    );
    return { success: false, error: error?.message };
  }
}

export async function bulkArchiveProductSubCategoryAction(ids: number[], entitiesData: any[]) {
  try {
    const results = await Promise.allSettled(
      ids.map(async (id, index) => {
        const entityData = entitiesData[index];
        const archivedEntity = {
          ...entityData,
          status: ProductSubCategoryDTOStatus.ARCHIVED,
        };
        return updateProductSubCategory(id, archivedEntity);
      })
    );

    const successCount = results.filter((r) => r.status === 'fulfilled').length;
    const errorCount = results.filter((r) => r.status === 'rejected').length;

    revalidatePath('/product-sub-categories');

    if (errorCount === 0) {
      productSubCategoryToast.custom.success(
        'Bulk Archive Complete',
        `${successCount} item${successCount > 1 ? 's' : ''} archived successfully`
      );
    } else {
      productSubCategoryToast.custom.warning(
        'Partial Archive',
        `${successCount} archived, ${errorCount} failed`
      );
    }

    return { success: errorCount === 0, successCount, errorCount };
  } catch (error) {
    console.error('Bulk archive failed:', error);
    productSubCategoryToast.custom.error(
      'Bulk Archive Failed',
      error?.message || 'Could not archive items'
    );
    return { success: false, error: error?.message };
  }
}

export async function bulkUpdateStatusProductSubCategoryAction(
  ids: number[],
  entitiesData: any[],
  newStatus: string
) {
  try {
    const statusValue =
      ProductSubCategoryDTOStatus[newStatus as keyof typeof ProductSubCategoryDTOStatus];
    const results = await Promise.allSettled(
      ids.map(async (id, index) => {
        const entityData = entitiesData[index];
        const updatedEntity = {
          ...entityData,
          status: statusValue,
        };
        return updateProductSubCategory(id, updatedEntity);
      })
    );

    const successCount = results.filter((r) => r.status === 'fulfilled').length;
    const errorCount = results.filter((r) => r.status === 'rejected').length;

    revalidatePath('/product-sub-categories');

    if (errorCount === 0) {
      productSubCategoryToast.custom.success(
        'Bulk Status Update Complete',
        `${successCount} item${successCount > 1 ? 's' : ''} updated to ${newStatus.toLowerCase()}`
      );
    } else {
      productSubCategoryToast.custom.warning(
        'Partial Status Update',
        `${successCount} updated, ${errorCount} failed`
      );
    }

    return { success: errorCount === 0, successCount, errorCount };
  } catch (error) {
    console.error('Bulk status update failed:', error);
    productSubCategoryToast.custom.error(
      'Bulk Status Update Failed',
      error?.message || 'Could not update status for items'
    );
    return { success: false, error: error?.message };
  }
}
