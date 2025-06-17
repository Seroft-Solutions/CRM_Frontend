"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { toast } from "sonner";
import { userAvailabilityToast } from "../components/user-availability-toast";

export async function createUserAvailabilityAction(formData: FormData) {
  try {
    // Process form data and create entity
    const result = await createUserAvailability(formData);
    
    revalidatePath("/user-availabilities");
    userAvailabilityToast.created();
    
    return { success: true, data: result };
  } catch (error) {
    console.error("Failed to create useravailability:", error);
    userAvailabilityToast.createError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function updateUserAvailabilityAction(id: number, formData: FormData) {
  try {
    const result = await updateUserAvailability(id, formData);
    
    revalidatePath("/user-availabilities");
    revalidatePath(`/user-availabilities/${id}`);
    userAvailabilityToast.updated();
    
    return { success: true, data: result };
  } catch (error) {
    console.error("Failed to update useravailability:", error);
    userAvailabilityToast.updateError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function deleteUserAvailabilityAction(id: number) {
  try {
    await deleteUserAvailability(id);
    
    revalidatePath("/user-availabilities");
    userAvailabilityToast.deleted();
    
    return { success: true };
  } catch (error) {
    console.error("Failed to delete useravailability:", error);
    userAvailabilityToast.deleteError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function bulkDeleteUserAvailabilityAction(ids: number[]) {
  try {
    const results = await Promise.allSettled(
      ids.map(id => deleteUserAvailability(id))
    );
    
    const successCount = results.filter(r => r.status === 'fulfilled').length;
    const errorCount = results.filter(r => r.status === 'rejected').length;
    
    revalidatePath("/user-availabilities");
    
    if (errorCount === 0) {
      userAvailabilityToast.bulkDeleted(successCount);
    } else if (successCount > 0) {
      toast.warning(`${successCount} deleted, ${errorCount} failed`);
    } else {
      userAvailabilityToast.bulkDeleteError();
    }
    
    return { success: errorCount === 0, successCount, errorCount };
  } catch (error) {
    console.error("Bulk delete failed:", error);
    userAvailabilityToast.bulkDeleteError(error?.message);
    return { success: false, error: error?.message };
  }
}
