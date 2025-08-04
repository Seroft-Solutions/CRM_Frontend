// ===============================================================
// 🛑 AUTO-GENERATED FILE – DO NOT EDIT DIRECTLY 🛑
// - Source: code generation pipeline
// - To customize: use ./overrides/[filename].ts or feature-level
//   extensions (e.g., ./src/features/.../extensions/)
// - Direct edits will be overwritten on regeneration
// ===============================================================
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
// Import the generated API functions directly
import { 
  createCustomer,
  updateCustomer, 
  deleteCustomer 
} from "@/core/api/generated/spring/endpoints/customer-resource/customer-resource.gen";
import { customerToast } from "@/app/(protected)/(features)/customers/components/customer-toast";

export async function createCustomerAction(data: any) {
  try {
    // Create entity using the generated API function
    const result = await createCustomer(data);
    
    // Revalidate both the main list page and any related pages
    revalidatePath("/customers");
    revalidatePath("/customers/new");
    customerToast.created();
    
    return { success: true, data: result };
  } catch (error) {
    console.error("Failed to create customer:", error);
    customerToast.createError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function updateCustomerAction(id: number, data: any) {
  try {
    // Update entity using the generated API function with correct signature
    const result = await updateCustomer(id, data);
    
    // Revalidate all related paths to ensure fresh data
    revalidatePath("/customers");
    revalidatePath(`/customers/${id}`);
    revalidatePath(`/customers/${id}/edit`);
    customerToast.updated();
    
    return { success: true, data: result };
  } catch (error) {
    console.error("Failed to update customer:", error);
    customerToast.updateError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function deleteCustomerAction(id: number) {
  try {
    await deleteCustomer(id);
    
    revalidatePath("/customers");
    customerToast.deleted();
    
    return { success: true };
  } catch (error) {
    console.error("Failed to delete customer:", error);
    customerToast.deleteError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function bulkDeleteCustomerAction(ids: number[]) {
  try {
    const results = await Promise.allSettled(
      ids.map(id => deleteCustomer(id))
    );
    
    const successCount = results.filter(r => r.status === 'fulfilled').length;
    const errorCount = results.filter(r => r.status === 'rejected').length;
    
    // Revalidate to ensure table reflects deletions
    revalidatePath("/customers");
    
    if (errorCount === 0) {
      customerToast.bulkDeleted(successCount);
    } else {
      customerToast.bulkDeleteError();
    }
    
    return { success: errorCount === 0, successCount, errorCount };
  } catch (error) {
    console.error("Bulk delete failed:", error);
    customerToast.bulkDeleteError(error?.message);
    return { success: false, error: error?.message };
  }
}
