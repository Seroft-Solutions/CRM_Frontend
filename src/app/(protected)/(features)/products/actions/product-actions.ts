"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { toast } from "sonner";
import { productToast } from "@/app/(protected)/(features)/products/components/product-toast";

export async function createProductAction(formData: FormData) {
  try {
    // Process form data and create entity
    const result = await createProduct(formData);
    
    revalidatePath("/products");
    productToast.created();
    
    return { success: true, data: result };
  } catch (error) {
    console.error("Failed to create product:", error);
    productToast.createError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function updateProductAction(id: number, formData: FormData) {
  try {
    const result = await updateProduct(id, formData);
    
    revalidatePath("/products");
    revalidatePath(`/products/${id}`);
    productToast.updated();
    
    return { success: true, data: result };
  } catch (error) {
    console.error("Failed to update product:", error);
    productToast.updateError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function deleteProductAction(id: number) {
  try {
    await deleteProduct(id);
    
    revalidatePath("/products");
    productToast.deleted();
    
    return { success: true };
  } catch (error) {
    console.error("Failed to delete product:", error);
    productToast.deleteError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function bulkDeleteProductAction(ids: number[]) {
  try {
    const results = await Promise.allSettled(
      ids.map(id => deleteProduct(id))
    );
    
    const successCount = results.filter(r => r.status === 'fulfilled').length;
    const errorCount = results.filter(r => r.status === 'rejected').length;
    
    revalidatePath("/products");
    
    if (errorCount === 0) {
      productToast.bulkDeleted(successCount);
    } else if (successCount > 0) {
      toast.warning(`${successCount} deleted, ${errorCount} failed`);
    } else {
      productToast.bulkDeleteError();
    }
    
    return { success: errorCount === 0, successCount, errorCount };
  } catch (error) {
    console.error("Bulk delete failed:", error);
    productToast.bulkDeleteError(error?.message);
    return { success: false, error: error?.message };
  }
}
