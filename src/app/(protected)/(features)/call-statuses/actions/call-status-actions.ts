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
  createCallStatus,
  updateCallStatus,
  deleteCallStatus,
} from '@/core/api/generated/spring/endpoints/call-status-resource/call-status-resource.gen';
import { callStatusToast } from '@/app/(protected)/(features)/call-statuses/components/call-status-toast';

export async function createCallStatusAction(data: any) {
  try {
    // Create entity using the generated API function
    const result = await createCallStatus(data);

    // Revalidate both the main list page and any related pages
    revalidatePath('/call-statuses');
    revalidatePath('/call-statuses/new');
    callStatusToast.created();

    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to create callstatus:', error);
    callStatusToast.createError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function updateCallStatusAction(id: number, data: any) {
  try {
    // Update entity using the generated API function with correct signature
    const result = await updateCallStatus(id, data);

    // Revalidate all related paths to ensure fresh data
    revalidatePath('/call-statuses');
    revalidatePath(`/call-statuses/${id}`);
    revalidatePath(`/call-statuses/${id}/edit`);
    callStatusToast.updated();

    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to update callstatus:', error);
    callStatusToast.updateError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function deleteCallStatusAction(id: number) {
  try {
    await deleteCallStatus(id);

    revalidatePath('/call-statuses');
    callStatusToast.deleted();

    return { success: true };
  } catch (error) {
    console.error('Failed to delete callstatus:', error);
    callStatusToast.deleteError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function bulkDeleteCallStatusAction(ids: number[]) {
  try {
    const results = await Promise.allSettled(ids.map((id) => deleteCallStatus(id)));

    const successCount = results.filter((r) => r.status === 'fulfilled').length;
    const errorCount = results.filter((r) => r.status === 'rejected').length;

    // Revalidate to ensure table reflects deletions
    revalidatePath('/call-statuses');

    if (errorCount === 0) {
      callStatusToast.bulkDeleted(successCount);
    } else {
      callStatusToast.bulkDeleteError();
    }

    return { success: errorCount === 0, successCount, errorCount };
  } catch (error) {
    console.error('Bulk delete failed:', error);
    callStatusToast.bulkDeleteError(error?.message);
    return { success: false, error: error?.message };
  }
}
