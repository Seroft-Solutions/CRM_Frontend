'use server'

import { verifySession, hasRole, getCurrentOrganization } from '@/lib/dal'
import { springService } from '@/core/api/services/spring-service'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

// Define validation schema for SubCallType
const subcalltypeSchema = z.object({
  
  
  name: z.string().min(2).max(50),
  
  
  
  code: z.string().min(2).max(10),
  
  
  
  description: z.string().max(255).optional(),
  
  
  
  isActive: z.boolean(),
  
  
  
  sortOrder: z.number().min(0).optional(),
  
  
  
  remark: z.string().max(1000).optional(),
  
  
  
  createdDate: z.string().datetime(),
  
  
  
  lastModifiedDate: z.string().datetime().optional(),
  
  
  
  
  callTypeId: z.number().optional(),
  
  
})

export type SubCallTypeFormData = z.infer<typeof subcalltypeSchema>

/**
 * Create a new SubCallType
 */
export async function createSubCallType(
  prevState: any,
  formData: FormData
): Promise<{ success?: boolean; error?: string; errors?: Record<string, string[]> }> {
  try {
    // Verify session and check permissions
    const session = await verifySession()
    const currentOrg = await getCurrentOrganization()
    
    if (!(await hasRole('subCallType:create'))) {
      return { error: 'Insufficient permissions to create sub call type' }
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
      
      
      
      
      callTypeId: formData.get('callTypeId') ? Number(formData.get('callTypeId')) : undefined,
      
      
    }

    const validatedData = subcalltypeSchema.parse(rawData)

    // Add organization context if available
    const dataWithOrg = currentOrg 
      ? { ...validatedData, organizationId: currentOrg.id }
      : validatedData

    // Create the entity
    await springService.post('/sub-call-types', dataWithOrg)

    // Revalidate the list page
    revalidatePath('/sub-call-types')
    
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
    
    console.error('Error creating SubCallType:', error)
    return { error: 'Failed to create sub call type. Please try again.' }
  }

  // Redirect to the list page on success
  redirect('/sub-call-types')
}

/**
 * Update an existing SubCallType
 */
export async function updateSubCallType(
  id: number,
  prevState: any,
  formData: FormData
): Promise<{ success?: boolean; error?: string; errors?: Record<string, string[]> }> {
  try {
    // Verify session and check permissions
    const session = await verifySession()
    const currentOrg = await getCurrentOrganization()
    
    if (!(await hasRole('subCallType:update'))) {
      return { error: 'Insufficient permissions to update sub call type' }
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
      
      
      
      
      callTypeId: formData.get('callTypeId') ? Number(formData.get('callTypeId')) : undefined,
      
      
    }

    const validatedData = subcalltypeSchema.parse(rawData)

    // Add organization context if available
    const dataWithOrg = currentOrg 
      ? { ...validatedData, organizationId: currentOrg.id }
      : validatedData

    // Update the entity
    await springService.put(`/sub-call-types/${id}`, { id, ...dataWithOrg })

    // Revalidate pages
    revalidatePath('/sub-call-types')
    revalidatePath(`/sub-call-types/${id}`)
    
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
    
    console.error('Error updating SubCallType:', error)
    return { error: 'Failed to update sub call type. Please try again.' }
  }

  // Redirect to the details page on success
  redirect(`/sub-call-types/${id}`)
}

/**
 * Delete a SubCallType
 */
export async function deleteSubCallType(id: number): Promise<{ success?: boolean; error?: string }> {
  try {
    // Verify session and check permissions
    const session = await verifySession()
    
    if (!(await hasRole('subCallType:delete'))) {
      return { error: 'Insufficient permissions to delete sub call type' }
    }

    // Delete the entity
    await springService.delete(`/sub-call-types/${id}`)

    // Revalidate the list page
    revalidatePath('/sub-call-types')
    
    return { success: true }
  } catch (error) {
    console.error('Error deleting SubCallType:', error)
    return { error: 'Failed to delete sub call type. Please try again.' }
  }
}

/**
 * Get SubCallTypes for current organization
 */
export async function getSubCallTypesForOrganization() {
  try {
    const session = await verifySession()
    const currentOrg = await getCurrentOrganization()
    
    if (!(await hasRole('subCallType:read'))) {
      throw new Error('Insufficient permissions to read sub call types')
    }
    
    // Build query parameters with organization filter
    const params = currentOrg ? { organizationId: currentOrg.id } : {}
    
    const response = await springService.get('/sub-call-types', { params })
    return response
  } catch (error) {
    console.error('Error fetching SubCallTypes for organization:', error)
    throw error
  }
}
