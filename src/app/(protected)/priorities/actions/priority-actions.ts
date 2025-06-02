'use server'

import { verifySession, hasRole, getCurrentOrganization } from '@/lib/dal'
import { springService } from '@/core/api/services/spring-service'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

// Define validation schema for Priority
const prioritySchema = z.object({
  
  
  name: z.string().min(2).max(50),
  
  
  
  level: z.any(),
  
  
  
  description: z.string().max(255).optional(),
  
  
  
  colorCode: z.string().optional(),
  
  
  
  sortOrder: z.number().min(0).optional(),
  
  
  
  remark: z.any().optional(),
  
  
  
  isActive: z.boolean(),
  
  
  
  createdDate: z.string().datetime(),
  
  
  
  lastModifiedDate: z.string().datetime().optional(),
  
  
  
})

export type PriorityFormData = z.infer<typeof prioritySchema>

/**
 * Create a new Priority
 */
export async function createPriority(
  prevState: any,
  formData: FormData
): Promise<{ success?: boolean; error?: string; errors?: Record<string, string[]> }> {
  try {
    // Verify session and check permissions
    const session = await verifySession()
    const currentOrg = await getCurrentOrganization()
    
    if (!(await hasRole('priority:create'))) {
      return { error: 'Insufficient permissions to create priority' }
    }

    // Parse and validate form data
    const rawData = {
      
      
      name: formData.get('name') || undefined,
      
      
      
      level: formData.get('level') || undefined,
      
      
      
      description: formData.get('description') || undefined,
      
      
      
      colorCode: formData.get('colorCode') || undefined,
      
      
      
      sortOrder: formData.get('sortOrder') ? Number(formData.get('sortOrder')) : undefined,
      
      
      
      remark: formData.get('remark') || undefined,
      
      
      
      isActive: formData.get('isActive') === 'true',
      
      
      
      createdDate: formData.get('createdDate') || undefined,
      
      
      
      lastModifiedDate: formData.get('lastModifiedDate') || undefined,
      
      
      
    }

    const validatedData = prioritySchema.parse(rawData)

    // Add organization context if available
    const dataWithOrg = currentOrg 
      ? { ...validatedData, organizationId: currentOrg.id }
      : validatedData

    // Create the entity
    await springService.post('/priorities', dataWithOrg)

    // Revalidate the list page
    revalidatePath('/priorities')
    
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
    
    console.error('Error creating Priority:', error)
    return { error: 'Failed to create priority. Please try again.' }
  }

  // Redirect to the list page on success
  redirect('/priorities')
}

/**
 * Update an existing Priority
 */
export async function updatePriority(
  id: number,
  prevState: any,
  formData: FormData
): Promise<{ success?: boolean; error?: string; errors?: Record<string, string[]> }> {
  try {
    // Verify session and check permissions
    const session = await verifySession()
    const currentOrg = await getCurrentOrganization()
    
    if (!(await hasRole('priority:update'))) {
      return { error: 'Insufficient permissions to update priority' }
    }

    // Parse and validate form data
    const rawData = {
      
      
      name: formData.get('name') || undefined,
      
      
      
      level: formData.get('level') || undefined,
      
      
      
      description: formData.get('description') || undefined,
      
      
      
      colorCode: formData.get('colorCode') || undefined,
      
      
      
      sortOrder: formData.get('sortOrder') ? Number(formData.get('sortOrder')) : undefined,
      
      
      
      remark: formData.get('remark') || undefined,
      
      
      
      isActive: formData.get('isActive') === 'true',
      
      
      
      createdDate: formData.get('createdDate') || undefined,
      
      
      
      lastModifiedDate: formData.get('lastModifiedDate') || undefined,
      
      
      
    }

    const validatedData = prioritySchema.parse(rawData)

    // Add organization context if available
    const dataWithOrg = currentOrg 
      ? { ...validatedData, organizationId: currentOrg.id }
      : validatedData

    // Update the entity
    await springService.put(`/priorities/${id}`, { id, ...dataWithOrg })

    // Revalidate pages
    revalidatePath('/priorities')
    revalidatePath(`/priorities/${id}`)
    
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
    
    console.error('Error updating Priority:', error)
    return { error: 'Failed to update priority. Please try again.' }
  }

  // Redirect to the details page on success
  redirect(`/priorities/${id}`)
}

/**
 * Delete a Priority
 */
export async function deletePriority(id: number): Promise<{ success?: boolean; error?: string }> {
  try {
    // Verify session and check permissions
    const session = await verifySession()
    
    if (!(await hasRole('priority:delete'))) {
      return { error: 'Insufficient permissions to delete priority' }
    }

    // Delete the entity
    await springService.delete(`/priorities/${id}`)

    // Revalidate the list page
    revalidatePath('/priorities')
    
    return { success: true }
  } catch (error) {
    console.error('Error deleting Priority:', error)
    return { error: 'Failed to delete priority. Please try again.' }
  }
}

/**
 * Get Priorities for current organization
 */
export async function getPrioritiesForOrganization() {
  try {
    const session = await verifySession()
    const currentOrg = await getCurrentOrganization()
    
    if (!(await hasRole('priority:read'))) {
      throw new Error('Insufficient permissions to read priorities')
    }
    
    // Build query parameters with organization filter
    const params = currentOrg ? { organizationId: currentOrg.id } : {}
    
    const response = await springService.get('/priorities', { params })
    return response
  } catch (error) {
    console.error('Error fetching Priorities for organization:', error)
    throw error
  }
}
