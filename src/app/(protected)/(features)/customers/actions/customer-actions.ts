'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { toast } from 'sonner';
import { customerToast } from '../components/customer-toast';

export async function createCustomerAction(formData: FormData) {
  try {
    // Process form data and create entity
    const result = await createCustomer(formData);

    revalidatePath('/customers');
    customerToast.created();

    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to create customer:', error);
    customerToast.createError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function updateCustomerAction(id: number, formData: FormData) {
  try {
    const result = await updateCustomer(id, formData);

    revalidatePath('/customers');
    revalidatePath(`/customers/${id}`);
    customerToast.updated();

    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to update customer:', error);
    customerToast.updateError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function deleteCustomerAction(id: number) {
  try {
    await deleteCustomer(id);

    revalidatePath('/customers');
    customerToast.deleted();

    return { success: true };
  } catch (error) {
    console.error('Failed to delete customer:', error);
    customerToast.deleteError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function bulkDeleteCustomerAction(ids: number[]) {
  try {
    const results = await Promise.allSettled(ids.map((id) => deleteCustomer(id)));

    const successCount = results.filter((r) => r.status === 'fulfilled').length;
    const errorCount = results.filter((r) => r.status === 'rejected').length;

    revalidatePath('/customers');

    if (errorCount === 0) {
      customerToast.bulkDeleted(successCount);
    } else if (successCount > 0) {
      toast.warning(`${successCount} deleted, ${errorCount} failed`);
    } else {
      customerToast.bulkDeleteError();
    }

    return { success: errorCount === 0, successCount, errorCount };
  } catch (error) {
    console.error('Bulk delete failed:', error);
    customerToast.bulkDeleteError(error?.message);
    return { success: false, error: error?.message };
  }
}
