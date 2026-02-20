'use server';

import { revalidatePath } from 'next/cache';

import {
  createProductCatalog,
  updateProductCatalog,
} from '@/core/api/generated/spring/endpoints/product-catalog-resource/product-catalog-resource.gen';
import { productCatalogToast } from '../components/product-catalog-toast';

export async function createProductCatalogAction(data: any) {
  try {
    const result = await createProductCatalog(data);

    revalidatePath('/product-catalogs');
    revalidatePath('/product-catalogs/new');
    productCatalogToast.created();

    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to create product catalog:', error);
    productCatalogToast.createError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function updateProductCatalogAction(id: number, data: any) {
  try {
    const result = await updateProductCatalog(id, data);

    revalidatePath('/product-catalogs');
    revalidatePath(`/product-catalogs/${id}`);
    revalidatePath(`/product-catalogs/${id}/edit`);
    productCatalogToast.updated();

    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to update product catalog:', error);
    productCatalogToast.updateError(error?.message);
    return { success: false, error: error?.message };
  }
}
