'use server'

import { verifySession, hasRole, getCurrentOrganization } from '@/lib/dal'
import { springService } from '@/core/api/services/spring-service'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

// Define validation schema for Product
const productSchema = z.object({
  
  
  name: z.string(),
  
  
  
  description: z.string().optional(),
  
  
  
  remark: z.any().optional(),
  
  
  
})

export type ProductFormData = z.infer<typeof productSchema>

/**
 * Create a new Product
 */
export async function createProduct(
  prevState: any,
  formData: FormData
): Promise<{ success?: boolean; error?: string; errors?: Record<string, string[]> }> {
  try {
    // Verify session and check permissions
    const session = await verifySession()
    const currentOrg = await getCurrentOrganization()
    
    if (!(await hasRole('product:create'))) {
      return { error: 'Insufficient permissions to create product' }
    }

    // Parse and validate form data
    const rawData = {
      
      
      name: formData.get('name') || undefined,
      
      
      
      description: formData.get('description') || undefined,
      
      
      
      remark: formData.get('remark') || undefined,
      
      
      
    }

    const validatedData = productSchema.parse(rawData)

    // Add organization context if available
    const dataWithOrg = currentOrg 
      ? { ...validatedData, organizationId: currentOrg.id }
      : validatedData

    // Create the entity
    await springService.post('/products', dataWithOrg)

    // Revalidate the list page
    revalidatePath('/products')
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        errors: error.flatten().fieldErrors
      }
    }
    
    console.error('Error creating Product:', error)
    return { error: 'Failed to create product. Please try again.' }
  }

  // Redirect to the list page on success
  redirect('/products')
}

/**
 * Update an existing Product
 */
export async function updateProduct(
  id: number,
  prevState: any,
  formData: FormData
): Promise<{ success?: boolean; error?: string; errors?: Record<string, string[]> }> {
  try {
    // Verify session and check permissions
    const session = await verifySession()
    const currentOrg = await getCurrentOrganization()
    
    if (!(await hasRole('product:update'))) {
      return { error: 'Insufficient permissions to update product' }
    }

    // Parse and validate form data
    const rawData = {
      
      
      name: formData.get('name') || undefined,
      
      
      
      description: formData.get('description') || undefined,
      
      
      
      remark: formData.get('remark') || undefined,
      
      
      
    }

    const validatedData = productSchema.parse(rawData)

    // Add organization context if available
    const dataWithOrg = currentOrg 
      ? { ...validatedData, organizationId: currentOrg.id }
      : validatedData

    // Update the entity
    await springService.put(`/products/${id}`, { id, ...dataWithOrg })

    // Revalidate pages
    revalidatePath('/products')
    revalidatePath(`/products/${id}`)
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        errors: error.flatten().fieldErrors
      }
    }
    
    console.error('Error updating Product:', error)
    return { error: 'Failed to update product. Please try again.' }
  }

  // Redirect to the details page on success
  redirect(`/products/${id}`)
}

/**
 * Delete a Product
 */
export async function deleteProduct(id: number): Promise<{ success?: boolean; error?: string }> {
  try {
    // Verify session and check permissions
    const session = await verifySession()
    
    if (!(await hasRole('product:delete'))) {
      return { error: 'Insufficient permissions to delete product' }
    }

    // Delete the entity
    await springService.delete(`/products/${id}`)

    // Revalidate the list page
    revalidatePath('/products')
    
    return { success: true }
  } catch (error) {
    console.error('Error deleting Product:', error)
    return { error: 'Failed to delete product. Please try again.' }
  }
}

/**
 * Get Products for current organization
 */
export async function getProductsForOrganization() {
  try {
    const session = await verifySession()
    const currentOrg = await getCurrentOrganization()
    
    if (!(await hasRole('product:read'))) {
      throw new Error('Insufficient permissions to read products')
    }
    
    // Build query parameters with organization filter
    const params = currentOrg ? { organizationId: currentOrg.id } : {}
    
    const response = await springService.get('/products', { params })
    return response
  } catch (error) {
    console.error('Error fetching Products for organization:', error)
    throw error
  }
}
