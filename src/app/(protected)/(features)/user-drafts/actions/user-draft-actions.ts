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
  createUserDraft,
  updateUserDraft,
  deleteUserDraft,
} from '@/core/api/generated/spring/endpoints/user-draft-resource/user-draft-resource.gen';
import { userDraftToast } from '@/app/(protected)/(features)/user-drafts/components/user-draft-toast';

export async function createUserDraftAction(data: any) {
  try {
    // Create entity using the generated API function
    const result = await createUserDraft(data);

    // Revalidate both the main list page and any related pages
    revalidatePath('/user-drafts');
    revalidatePath('/user-drafts/new');
    userDraftToast.created();

    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to create userdraft:', error);
    userDraftToast.createError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function updateUserDraftAction(id: number, data: any) {
  try {
    // Update entity using the generated API function with correct signature
    const result = await updateUserDraft(id, data);

    // Revalidate all related paths to ensure fresh data
    revalidatePath('/user-drafts');
    revalidatePath(`/user-drafts/${id}`);
    revalidatePath(`/user-drafts/${id}/edit`);
    userDraftToast.updated();

    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to update userdraft:', error);
    userDraftToast.updateError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function deleteUserDraftAction(id: number) {
  try {
    await deleteUserDraft(id);

    revalidatePath('/user-drafts');
    userDraftToast.deleted();

    return { success: true };
  } catch (error) {
    console.error('Failed to delete userdraft:', error);
    userDraftToast.deleteError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function bulkDeleteUserDraftAction(ids: number[]) {
  try {
    const results = await Promise.allSettled(ids.map((id) => deleteUserDraft(id)));

    const successCount = results.filter((r) => r.status === 'fulfilled').length;
    const errorCount = results.filter((r) => r.status === 'rejected').length;

    // Revalidate to ensure table reflects deletions
    revalidatePath('/user-drafts');

    if (errorCount === 0) {
      userDraftToast.bulkDeleted(successCount);
    } else {
      userDraftToast.bulkDeleteError();
    }

    return { success: errorCount === 0, successCount, errorCount };
  } catch (error) {
    console.error('Bulk delete failed:', error);
    userDraftToast.bulkDeleteError(error?.message);
    return { success: false, error: error?.message };
  }
}
