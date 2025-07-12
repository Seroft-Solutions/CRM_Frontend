"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { toast } from "sonner";
import { cityToast } from "@/app/(protected)/(features)/cities/components/city-toast";

export async function createCityAction(formData: FormData) {
  try {
    // Process form data and create entity
    const result = await createCity(formData);
    
    revalidatePath("/cities");
    cityToast.created();
    
    return { success: true, data: result };
  } catch (error) {
    console.error("Failed to create city:", error);
    cityToast.createError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function updateCityAction(id: number, formData: FormData) {
  try {
    const result = await updateCity(id, formData);
    
    revalidatePath("/cities");
    revalidatePath(`/cities/${id}`);
    cityToast.updated();
    
    return { success: true, data: result };
  } catch (error) {
    console.error("Failed to update city:", error);
    cityToast.updateError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function deleteCityAction(id: number) {
  try {
    await deleteCity(id);
    
    revalidatePath("/cities");
    cityToast.deleted();
    
    return { success: true };
  } catch (error) {
    console.error("Failed to delete city:", error);
    cityToast.deleteError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function bulkDeleteCityAction(ids: number[]) {
  try {
    const results = await Promise.allSettled(
      ids.map(id => deleteCity(id))
    );
    
    const successCount = results.filter(r => r.status === 'fulfilled').length;
    const errorCount = results.filter(r => r.status === 'rejected').length;
    
    revalidatePath("/cities");
    
    if (errorCount === 0) {
      cityToast.bulkDeleted(successCount);
    } else if (successCount > 0) {
      toast.warning(`${successCount} deleted, ${errorCount} failed`);
    } else {
      cityToast.bulkDeleteError();
    }
    
    return { success: errorCount === 0, successCount, errorCount };
  } catch (error) {
    console.error("Bulk delete failed:", error);
    cityToast.bulkDeleteError(error?.message);
    return { success: false, error: error?.message };
  }
}
