'use server';

import { revalidatePath } from 'next/cache';
import {
  createPurchaseOrder,
  updatePurchaseOrder,
  type PurchaseOrderDTO,
} from '@/core/api/purchase-order';

export async function createPurchaseOrderAction(data: PurchaseOrderDTO) {
  try {
    const result = await createPurchaseOrder(data);

    revalidatePath('/purchase-orders');
    revalidatePath('/purchase-orders/new');

    return { success: true, data: result };
  } catch (error: any) {
    console.error('Failed to create purchase order:', error);
    return { success: false, error: error?.message ?? 'Failed to create purchase order' };
  }
}

export async function updatePurchaseOrderAction(id: number, data: PurchaseOrderDTO) {
  try {
    const result = await updatePurchaseOrder(id, data);

    revalidatePath('/purchase-orders');
    revalidatePath(`/purchase-orders/${id}`);
    revalidatePath(`/purchase-orders/${id}/edit`);

    return { success: true, data: result };
  } catch (error: any) {
    console.error('Failed to update purchase order:', error);
    return { success: false, error: error?.message ?? 'Failed to update purchase order' };
  }
}
