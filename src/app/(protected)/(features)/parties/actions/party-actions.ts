"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { toast } from "sonner";
import { partyToast } from "../components/party-toast";

export async function createPartyAction(formData: FormData) {
  try {
    // Process form data and create entity
    const result = await createParty(formData);
    
    revalidatePath("/parties");
    partyToast.created();
    
    return { success: true, data: result };
  } catch (error) {
    console.error("Failed to create party:", error);
    partyToast.createError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function updatePartyAction(id: number, formData: FormData) {
  try {
    const result = await updateParty(id, formData);
    
    revalidatePath("/parties");
    revalidatePath(`/parties/${id}`);
    partyToast.updated();
    
    return { success: true, data: result };
  } catch (error) {
    console.error("Failed to update party:", error);
    partyToast.updateError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function deletePartyAction(id: number) {
  try {
    await deleteParty(id);
    
    revalidatePath("/parties");
    partyToast.deleted();
    
    return { success: true };
  } catch (error) {
    console.error("Failed to delete party:", error);
    partyToast.deleteError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function bulkDeletePartyAction(ids: number[]) {
  try {
    const results = await Promise.allSettled(
      ids.map(id => deleteParty(id))
    );
    
    const successCount = results.filter(r => r.status === 'fulfilled').length;
    const errorCount = results.filter(r => r.status === 'rejected').length;
    
    revalidatePath("/parties");
    
    if (errorCount === 0) {
      partyToast.bulkDeleted(successCount);
    } else if (successCount > 0) {
      toast.warning(`${successCount} deleted, ${errorCount} failed`);
    } else {
      partyToast.bulkDeleteError();
    }
    
    return { success: errorCount === 0, successCount, errorCount };
  } catch (error) {
    console.error("Bulk delete failed:", error);
    partyToast.bulkDeleteError(error?.message);
    return { success: false, error: error?.message };
  }
}
