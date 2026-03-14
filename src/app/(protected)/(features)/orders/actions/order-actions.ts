'use server';

import { revalidatePath } from 'next/cache';
import {
  createOrder,
  updateOrder,
} from '@/core/api/generated/spring/endpoints/order-resource/order-resource.gen';
import type { OrderDTO } from '@/core/api/generated/spring/schemas';

export async function createOrderAction(data: OrderDTO) {
  try {
    const result = await createOrder(data);

    revalidatePath('/orders');
    revalidatePath('/orders/new');

    return { success: true, data: result };
  } catch (error: any) {
    console.error('Failed to create order:', error);
    return { success: false, error: error?.message ?? 'Failed to create order' };
  }
}

export async function updateOrderAction(id: number, data: OrderDTO) {
  try {
    const result = await updateOrder(id, data);

    revalidatePath('/orders');
    revalidatePath(`/orders/${id}`);
    revalidatePath(`/orders/${id}/edit`);

    return { success: true, data: result };
  } catch (error: any) {
    console.error('Failed to update order:', error);
    return { success: false, error: error?.message ?? 'Failed to update order' };
  }
}
