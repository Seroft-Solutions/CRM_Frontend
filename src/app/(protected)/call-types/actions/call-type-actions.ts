'use server'

import { verifySession, hasRole, getCurrentOrganization } from '@/lib/dal'
import { springService } from '@/core/api/services/spring-service'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

// Define validation schema for CallType
const calltypeSchema = z.object({
  
  
  name: z.string().min(2).max(50),
  
  
  
  description: z.string().max(255).optional(),
  
  
  
  isActive: z.boolean(),
  
  
  
  remark: z.string().max(1000).optional(),
  
  
  
})

export type CallTypeFormData = z.infer<typeof calltypeSchema>

/**
 * Create a new CallType
 */
export async function createCallType(
  prevState: any,
  formData: FormData
): Promise<{ success?: boolean; error?: string; errors?: Record<string, string[]> }> {
  try {
    // Verify session and check permissions
    const session = await verifySession()
    const currentOrg = await getCurrentOrganization()
    
    if (!(await hasRole('callType:create'))) {
      return { error: 'Insufficient permissions to create call type' }
    }

    // Parse and validate form data
    const rawData = {
      
      
      name: formData.get('name') || undefined,
      
      
      
      description: formData.get('description') || undefined,
      
      
      
      isActive: formData.get('isActive') === 'true',
      
      
      
      remark: formData.get('remark') || undefined,
      
      
      
    }

    const validatedData = calltypeSchema.parse(rawData)

    // Add organization context if available
    const dataWithOrg = currentOrg 
      ? { ...validatedData, organizationId: currentOrg.id }
      : validatedData

    // Create the entity
    await springService.post('/call-types', dataWithOrg)

    // Revalidate the list page
    revalidatePath('/call-types')
    
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
    
    console.error('Error creating CallType:', error)
    return { error: 'Failed to create call type. Please try again.' }
  }

  // Redirect to the list page on success
  redirect('/call-types')
}

/**
 * Update an existing CallType
 */
export async function updateCallType(
  id: number,
  prevState: any,
  formData: FormData
): Promise<{ success?: boolean; error?: string; errors?: Record<string, string[]> }> {
  try {
    // Verify session and check permissions
    const session = await verifySession()
    const currentOrg = await getCurrentOrganization()
    
    if (!(await hasRole('callType:update'))) {
      return { error: 'Insufficient permissions to update call type' }
    }

    // Parse and validate form data
    const rawData = {
      
      
      name: formData.get('name') || undefined,
      
      
      
      description: formData.get('description') || undefined,
      
      
      
      isActive: formData.get('isActive') === 'true',
      
      
      
      remark: formData.get('remark') || undefined,
      
      
      
    }

    const validatedData = calltypeSchema.parse(rawData)

    // Add organization context if available
    const dataWithOrg = currentOrg 
      ? { ...validatedData, organizationId: currentOrg.id }
      : validatedData

    // Update the entity
    await springService.put(`/call-types/${id}`, { id, ...dataWithOrg })

    // Revalidate pages
    revalidatePath('/call-types')
    revalidatePath(`/call-types/${id}`)
    
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
    
    console.error('Error updating CallType:', error)
    return { error: 'Failed to update call type. Please try again.' }
  }

  // Redirect to the details page on success
  redirect(`/call-types/${id}`)
}

/**
 * Delete a CallType
 */
export async function deleteCallType(id: number): Promise<{ success?: boolean; error?: string }> {
  try {
    // Verify session and check permissions
    const session = await verifySession()
    
    if (!(await hasRole('callType:delete'))) {
      return { error: 'Insufficient permissions to delete call type' }
    }

    // Delete the entity
    await springService.delete(`/call-types/${id}`)

    // Revalidate the list page
    revalidatePath('/call-types')
    
    return { success: true }
  } catch (error) {
    console.error('Error deleting CallType:', error)
    return { error: 'Failed to delete call type. Please try again.' }
  }
}

/**
 * Get CallTypes for current organization
 */
export async function getCallTypesForOrganization() {
  try {
    const session = await verifySession()
    const currentOrg = await getCurrentOrganization()
    
    if (!(await hasRole('callType:read'))) {
      throw new Error('Insufficient permissions to read call types')
    }
    
    // Build query parameters with organization filter
    const params = currentOrg ? { organizationId: currentOrg.id } : {}
    
    const response = await springService.get('/call-types', { params })
    return response
  } catch (error) {
    console.error('Error fetching CallTypes for organization:', error)
    throw error
  }
}
