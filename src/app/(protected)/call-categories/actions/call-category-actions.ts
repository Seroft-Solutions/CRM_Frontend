'use server'

import { verifySession, hasRole, getCurrentOrganization } from '@/lib/dal'
import { springService } from '@/core/api/services/spring-service'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

// Define validation schema for CallCategory
const callcategorySchema = z.object({
  
  
  name: z.string().min(2).max(50),
  
  
  
  code: z.string().min(2).max(10),
  
  
  
  description: z.string().max(255).optional(),
  
  
  
  isActive: z.boolean(),
  
  
  
  sortOrder: z.number().min(0).optional(),
  
  
  
  remark: z.any().optional(),
  
  
  
  createdDate: z.string().datetime(),
  
  
  
  lastModifiedDate: z.string().datetime().optional(),
  
  
  
})

export type CallCategoryFormData = z.infer<typeof callcategorySchema>

/**
 * Create a new CallCategory
 */
export async function createCallCategory(
  prevState: any,
  formData: FormData
): Promise<{ success?: boolean; error?: string; errors?: Record<string, string[]> }> {
  try {
    // Verify session and check permissions
    const session = await verifySession()
    const currentOrg = await getCurrentOrganization()
    
    if (!(await hasRole('callCategory:create'))) {
      return { error: 'Insufficient permissions to create call category' }
    }

    // Parse and validate form data
    const rawData = {
      
      
      name: formData.get('name') || undefined,
      
      
      
      code: formData.get('code') || undefined,
      
      
      
      description: formData.get('description') || undefined,
      
      
      
      isActive: formData.get('isActive') === 'true',
      
      
      
      sortOrder: formData.get('sortOrder') ? Number(formData.get('sortOrder')) : undefined,
      
      
      
      remark: formData.get('remark') || undefined,
      
      
      
      createdDate: formData.get('createdDate') || undefined,
      
      
      
      lastModifiedDate: formData.get('lastModifiedDate') || undefined,
      
      
      
    }

    const validatedData = callcategorySchema.parse(rawData)

    // Add organization context if available
    const dataWithOrg = currentOrg 
      ? { ...validatedData, organizationId: currentOrg.id }
      : validatedData

    // Create the entity
    await springService.post('/call-categories', dataWithOrg)

    // Revalidate the list page
    revalidatePath('/call-categories')
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fieldErrors = error.flatten().fieldErrors
      const cleanedErrors: Record<string, string[]> = {}
      
      // Filter out undefined values to match the expected type
      Object.entries(fieldErrors).forEach(([key, value]) => {
        if (value) {
          cleanedErrors[key] = value
        }
      })
      
      return {
        errors: cleanedErrors
      }
    }
    
    console.error('Error creating CallCategory:', error)
    return { error: 'Failed to create call category. Please try again.' }
  }

  // Redirect to the list page on success
  redirect('/call-categories')
}

/**
 * Update an existing CallCategory
 */
export async function updateCallCategory(
  id: number,
  prevState: any,
  formData: FormData
): Promise<{ success?: boolean; error?: string; errors?: Record<string, string[]> }> {
  try {
    // Verify session and check permissions
    const session = await verifySession()
    const currentOrg = await getCurrentOrganization()
    
    if (!(await hasRole('callCategory:update'))) {
      return { error: 'Insufficient permissions to update call category' }
    }

    // Parse and validate form data
    const rawData = {
      
      
      name: formData.get('name') || undefined,
      
      
      
      code: formData.get('code') || undefined,
      
      
      
      description: formData.get('description') || undefined,
      
      
      
      isActive: formData.get('isActive') === 'true',
      
      
      
      sortOrder: formData.get('sortOrder') ? Number(formData.get('sortOrder')) : undefined,
      
      
      
      remark: formData.get('remark') || undefined,
      
      
      
      createdDate: formData.get('createdDate') || undefined,
      
      
      
      lastModifiedDate: formData.get('lastModifiedDate') || undefined,
      
      
      
    }

    const validatedData = callcategorySchema.parse(rawData)

    // Add organization context if available
    const dataWithOrg = currentOrg 
      ? { ...validatedData, organizationId: currentOrg.id }
      : validatedData

    // Update the entity
    await springService.put(`/call-categories/${id}`, { id, ...dataWithOrg })

    // Revalidate pages
    revalidatePath('/call-categories')
    revalidatePath(`/call-categories/${id}`)
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fieldErrors = error.flatten().fieldErrors
      const cleanedErrors: Record<string, string[]> = {}
      
      // Filter out undefined values to match the expected type
      Object.entries(fieldErrors).forEach(([key, value]) => {
        if (value) {
          cleanedErrors[key] = value
        }
      })
      
      return {
        errors: cleanedErrors
      }
    }
    
    console.error('Error updating CallCategory:', error)
    return { error: 'Failed to update call category. Please try again.' }
  }

  // Redirect to the details page on success
  redirect(`/call-categories/${id}`)
}

/**
 * Delete a CallCategory
 */
export async function deleteCallCategory(id: number): Promise<{ success?: boolean; error?: string }> {
  try {
    // Verify session and check permissions
    const session = await verifySession()
    
    if (!(await hasRole('callCategory:delete'))) {
      return { error: 'Insufficient permissions to delete call category' }
    }

    // Delete the entity
    await springService.delete(`/call-categories/${id}`)

    // Revalidate the list page
    revalidatePath('/call-categories')
    
    return { success: true }
  } catch (error) {
    console.error('Error deleting CallCategory:', error)
    return { error: 'Failed to delete call category. Please try again.' }
  }
}

/**
 * Get CallCategories for current organization
 */
export async function getCallCategoriesForOrganization() {
  try {
    const session = await verifySession()
    const currentOrg = await getCurrentOrganization()
    
    if (!(await hasRole('callCategory:read'))) {
      throw new Error('Insufficient permissions to read call categories')
    }
    
    // Build query parameters with organization filter
    const params = currentOrg ? { organizationId: currentOrg.id } : {}
    
    const response = await springService.get('/call-categories', { params })
    return response
  } catch (error) {
    console.error('Error fetching CallCategories for organization:', error)
    throw error
  }
}
