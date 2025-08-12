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
  createCallType,
  updateCallType,
  deleteCallType,
} from '@/core/api/generated/spring/endpoints/call-type-resource/call-type-resource.gen';
import { callTypeToast } from '@/app/(protected)/(features)/call-types/components/call-type-toast';

export async function createCallTypeAction(data: any) {
  try {
    // Create entity using the generated API function
    const result = await createCallType(data);

    // Revalidate both the main list page and any related pages
    revalidatePath('/call-types');
    revalidatePath('/call-types/new');
    callTypeToast.created();

    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to create calltype:', error);
    callTypeToast.createError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function updateCallTypeAction(id: number, data: any) {
  try {
    // Update entity using the generated API function with correct signature
    const result = await updateCallType(id, data);

    // Revalidate all related paths to ensure fresh data
    revalidatePath('/call-types');
    revalidatePath(`/call-types/${id}`);
    revalidatePath(`/call-types/${id}/edit`);
    callTypeToast.updated();

    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to update calltype:', error);
    callTypeToast.updateError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function deleteCallTypeAction(id: number) {
  try {
    await deleteCallType(id);

    revalidatePath('/call-types');
    callTypeToast.deleted();

    return { success: true };
  } catch (error) {
    console.error('Failed to delete calltype:', error);
    callTypeToast.deleteError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function bulkDeleteCallTypeAction(ids: number[]) {
  try {
    const results = await Promise.allSettled(ids.map((id) => deleteCallType(id)));

    const successCount = results.filter((r) => r.status === 'fulfilled').length;
    const errorCount = results.filter((r) => r.status === 'rejected').length;

    // Revalidate to ensure table reflects deletions
    revalidatePath('/call-types');

    if (errorCount === 0) {
      callTypeToast.bulkDeleted(successCount);
    } else {
      callTypeToast.bulkDeleteError();
    }

    return { success: errorCount === 0, successCount, errorCount };
  } catch (error) {
    console.error('Bulk delete failed:', error);
    callTypeToast.bulkDeleteError(error?.message);
    return { success: false, error: error?.message };
  }
}
