'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import {
  createProduct,
  updateProduct,
} from '@/core/api/generated/spring/endpoints/product-resource/product-resource.gen';
import { ProductDTOStatus } from '@/core/api/generated/spring/schemas/ProductDTOStatus';
import { productToast } from '../components/product-toast';

export async function createProductAction(data: any) {
  try {
    const result = await createProduct(data);

    revalidatePath('/products');
    revalidatePath('/products/new');
    productToast.created();

    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to create product:', error);
    productToast.createError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function updateProductAction(id: number, data: any) {
  try {
    const result = await updateProduct(id, data);

    revalidatePath('/products');
    revalidatePath(`/products/${id}`);
    revalidatePath(`/products/${id}/edit`);
    productToast.updated();

    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to update product:', error);
    productToast.updateError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function archiveProductAction(id: number, entityData: any) {
  try {
    const archivedEntity = {
      ...entityData,
      status: ProductDTOStatus.ARCHIVED,
    };

    const result = await updateProduct(id, archivedEntity);

    revalidatePath('/products');
    productToast.custom.success('Archived Successfully', 'Product has been archived');

    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to archive product:', error);
    productToast.custom.error('Archive Failed', error?.message || 'Could not archive product');
    return { success: false, error: error?.message };
  }
}

export async function updateStatusProductAction(id: number, entityData: any, newStatus: string) {
  try {
    const statusValue = ProductDTOStatus[newStatus as keyof typeof ProductDTOStatus];
    const updatedEntity = {
      ...entityData,
      status: statusValue,
    };

    const result = await updateProduct(id, updatedEntity);

    revalidatePath('/products');
    productToast.custom.success(
      'Status Updated',
      `Product status changed to ${newStatus.toLowerCase()}`
    );

    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to update product status:', error);
    productToast.custom.error(
      'Status Update Failed',
      error?.message || 'Could not update product status'
    );
    return { success: false, error: error?.message };
  }
}

export async function bulkArchiveProductAction(ids: number[], entitiesData: any[]) {
  try {
    const results = await Promise.allSettled(
      ids.map(async (id, index) => {
        const entityData = entitiesData[index];
        const archivedEntity = {
          ...entityData,
          status: ProductDTOStatus.ARCHIVED,
        };
        return updateProduct(id, archivedEntity);
      })
    );

    const successCount = results.filter((r) => r.status === 'fulfilled').length;
    const errorCount = results.filter((r) => r.status === 'rejected').length;

    revalidatePath('/products');

    if (errorCount === 0) {
      productToast.custom.success(
        'Bulk Archive Complete',
        `${successCount} item${successCount > 1 ? 's' : ''} archived successfully`
      );
    } else {
      productToast.custom.warning(
        'Partial Archive',
        `${successCount} archived, ${errorCount} failed`
      );
    }

    return { success: errorCount === 0, successCount, errorCount };
  } catch (error) {
    console.error('Bulk archive failed:', error);
    productToast.custom.error('Bulk Archive Failed', error?.message || 'Could not archive items');
    return { success: false, error: error?.message };
  }
}

export async function bulkUpdateStatusProductAction(
  ids: number[],
  entitiesData: any[],
  newStatus: string
) {
  try {
    const statusValue = ProductDTOStatus[newStatus as keyof typeof ProductDTOStatus];
    const results = await Promise.allSettled(
      ids.map(async (id, index) => {
        const entityData = entitiesData[index];
        const updatedEntity = {
          ...entityData,
          status: statusValue,
        };
        return updateProduct(id, updatedEntity);
      })
    );

    const successCount = results.filter((r) => r.status === 'fulfilled').length;
    const errorCount = results.filter((r) => r.status === 'rejected').length;

    revalidatePath('/products');

    if (errorCount === 0) {
      productToast.custom.success(
        'Bulk Status Update Complete',
        `${successCount} item${successCount > 1 ? 's' : ''} updated to ${newStatus.toLowerCase()}`
      );
    } else {
      productToast.custom.warning(
        'Partial Status Update',
        `${successCount} updated, ${errorCount} failed`
      );
    }

    return { success: errorCount === 0, successCount, errorCount };
  } catch (error) {
    console.error('Bulk status update failed:', error);
    productToast.custom.error(
      'Bulk Status Update Failed',
      error?.message || 'Could not update status for items'
    );
    return { success: false, error: error?.message };
  }
}
