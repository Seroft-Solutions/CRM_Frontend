'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import {
  createCustomer,
  updateCustomer,
} from '@/core/api/generated/spring/endpoints/customer-resource/customer-resource.gen';
import { CustomerDTOStatus } from '@/core/api/generated/spring/schemas/CustomerDTOStatus';
import { customerToast } from '../components/customer-toast';

export async function createCustomerAction(data: any) {
  try {
    const result = await createCustomer(data);

    revalidatePath('/customers');
    revalidatePath('/customers/new');
    customerToast.created();

    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to create customer:', error);
    customerToast.createError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function updateCustomerAction(id: number, data: any) {
  try {
    const result = await updateCustomer(id, data);

    revalidatePath('/customers');
    revalidatePath(`/customers/${id}`);
    revalidatePath(`/customers/${id}/edit`);
    customerToast.updated();

    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to update customer:', error);
    customerToast.updateError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function archiveCustomerAction(id: number, entityData: any) {
  try {
    const archivedEntity = {
      ...entityData,
      status: CustomerDTOStatus.ARCHIVED,
    };

    const result = await updateCustomer(id, archivedEntity);

    revalidatePath('/customers');
    customerToast.custom.success('Archived Successfully', 'Customer has been archived');

    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to archive customer:', error);
    customerToast.custom.error('Archive Failed', error?.message || 'Could not archive customer');
    return { success: false, error: error?.message };
  }
}

export async function updateStatusCustomerAction(id: number, entityData: any, newStatus: string) {
  try {
    const statusValue = CustomerDTOStatus[newStatus as keyof typeof CustomerDTOStatus];
    const updatedEntity = {
      ...entityData,
      status: statusValue,
    };

    const result = await updateCustomer(id, updatedEntity);

    revalidatePath('/customers');
    customerToast.custom.success(
      'Status Updated',
      `Customer status changed to ${newStatus.toLowerCase()}`
    );

    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to update customer status:', error);
    customerToast.custom.error(
      'Status Update Failed',
      error?.message || 'Could not update customer status'
    );
    return { success: false, error: error?.message };
  }
}

export async function bulkArchiveCustomerAction(ids: number[], entitiesData: any[]) {
  try {
    const results = await Promise.allSettled(
      ids.map(async (id, index) => {
        const entityData = entitiesData[index];
        const archivedEntity = {
          ...entityData,
          status: CustomerDTOStatus.ARCHIVED,
        };
        return updateCustomer(id, archivedEntity);
      })
    );

    const successCount = results.filter((r) => r.status === 'fulfilled').length;
    const errorCount = results.filter((r) => r.status === 'rejected').length;

    revalidatePath('/customers');

    if (errorCount === 0) {
      customerToast.custom.success(
        'Bulk Archive Complete',
        `${successCount} item${successCount > 1 ? 's' : ''} archived successfully`
      );
    } else {
      customerToast.custom.warning(
        'Partial Archive',
        `${successCount} archived, ${errorCount} failed`
      );
    }

    return { success: errorCount === 0, successCount, errorCount };
  } catch (error) {
    console.error('Bulk archive failed:', error);
    customerToast.custom.error('Bulk Archive Failed', error?.message || 'Could not archive items');
    return { success: false, error: error?.message };
  }
}

export async function bulkUpdateStatusCustomerAction(
  ids: number[],
  entitiesData: any[],
  newStatus: string
) {
  try {
    const statusValue = CustomerDTOStatus[newStatus as keyof typeof CustomerDTOStatus];
    const results = await Promise.allSettled(
      ids.map(async (id, index) => {
        const entityData = entitiesData[index];
        const updatedEntity = {
          ...entityData,
          status: statusValue,
        };
        return updateCustomer(id, updatedEntity);
      })
    );

    const successCount = results.filter((r) => r.status === 'fulfilled').length;
    const errorCount = results.filter((r) => r.status === 'rejected').length;

    revalidatePath('/customers');

    if (errorCount === 0) {
      customerToast.custom.success(
        'Bulk Status Update Complete',
        `${successCount} item${successCount > 1 ? 's' : ''} updated to ${newStatus.toLowerCase()}`
      );
    } else {
      customerToast.custom.warning(
        'Partial Status Update',
        `${successCount} updated, ${errorCount} failed`
      );
    }

    return { success: errorCount === 0, successCount, errorCount };
  } catch (error) {
    console.error('Bulk status update failed:', error);
    customerToast.custom.error(
      'Bulk Status Update Failed',
      error?.message || 'Could not update status for items'
    );
    return { success: false, error: error?.message };
  }
}
