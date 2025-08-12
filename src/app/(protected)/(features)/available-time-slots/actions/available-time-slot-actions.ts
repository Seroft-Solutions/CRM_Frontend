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
  createAvailableTimeSlot,
  updateAvailableTimeSlot,
  deleteAvailableTimeSlot,
} from '@/core/api/generated/spring/endpoints/available-time-slot-resource/available-time-slot-resource.gen';
import { availableTimeSlotToast } from '@/app/(protected)/(features)/available-time-slots/components/available-time-slot-toast';

export async function createAvailableTimeSlotAction(data: any) {
  try {
    // Create entity using the generated API function
    const result = await createAvailableTimeSlot(data);

    // Revalidate both the main list page and any related pages
    revalidatePath('/available-time-slots');
    revalidatePath('/available-time-slots/new');
    availableTimeSlotToast.created();

    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to create availabletimeslot:', error);
    availableTimeSlotToast.createError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function updateAvailableTimeSlotAction(id: number, data: any) {
  try {
    // Update entity using the generated API function with correct signature
    const result = await updateAvailableTimeSlot(id, data);

    // Revalidate all related paths to ensure fresh data
    revalidatePath('/available-time-slots');
    revalidatePath(`/available-time-slots/${id}`);
    revalidatePath(`/available-time-slots/${id}/edit`);
    availableTimeSlotToast.updated();

    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to update availabletimeslot:', error);
    availableTimeSlotToast.updateError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function deleteAvailableTimeSlotAction(id: number) {
  try {
    await deleteAvailableTimeSlot(id);

    revalidatePath('/available-time-slots');
    availableTimeSlotToast.deleted();

    return { success: true };
  } catch (error) {
    console.error('Failed to delete availabletimeslot:', error);
    availableTimeSlotToast.deleteError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function bulkDeleteAvailableTimeSlotAction(ids: number[]) {
  try {
    const results = await Promise.allSettled(ids.map((id) => deleteAvailableTimeSlot(id)));

    const successCount = results.filter((r) => r.status === 'fulfilled').length;
    const errorCount = results.filter((r) => r.status === 'rejected').length;

    // Revalidate to ensure table reflects deletions
    revalidatePath('/available-time-slots');

    if (errorCount === 0) {
      availableTimeSlotToast.bulkDeleted(successCount);
    } else {
      availableTimeSlotToast.bulkDeleteError();
    }

    return { success: errorCount === 0, successCount, errorCount };
  } catch (error) {
    console.error('Bulk delete failed:', error);
    availableTimeSlotToast.bulkDeleteError(error?.message);
    return { success: false, error: error?.message };
  }
}
