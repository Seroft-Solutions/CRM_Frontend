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
  createProduct,
  updateProduct, 
  deleteProduct 
} from "@/core/api/generated/spring/endpoints/product-resource/product-resource.gen";
import { productToast } from "../components/product-toast";

export async function createProductAction(data: any) {
  try {
    // Create entity using the generated API function
    const result = await createProduct(data);
    
    // Revalidate both the main list page and any related pages
    revalidatePath("/products");
    revalidatePath("/products/new");
    productToast.created();
    
    return { success: true, data: result };
  } catch (error) {
    console.error("Failed to create product:", error);
    productToast.createError(error?.message);
    return { success: false, error: error?.message };
  }
}

export async function updateProductAction(id: number, data: any) {
  try {
    // Update entity using the generated API function with correct signature
    const result = await updateProduct(id, data);
    
    // Revalidate all related paths to ensure fresh data
    revalidatePath("/products");
    revalidatePath(`/products/${id}`);
    revalidatePath(`/products/${id}/edit`);
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
    
    // Revalidate to ensure table reflects deletions
    revalidatePath("/products");
    
    if (errorCount === 0) {
      productToast.bulkDeleted(successCount);
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
