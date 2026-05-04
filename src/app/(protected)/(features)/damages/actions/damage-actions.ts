'use server';

import { revalidatePath } from 'next/cache';

export async function createDamageAction(data: any) {
  try {
    const response = await fetch(`${process.env.API_BASE_URL || ''}/api/product-damages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to create damage record');
    }

    revalidatePath('/damages');
    return { success: true, data: await response.json() };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}
