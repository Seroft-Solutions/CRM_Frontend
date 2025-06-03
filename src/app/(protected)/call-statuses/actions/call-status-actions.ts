'use server'

import { verifySession, hasRole, getCurrentOrganization } from '@/lib/dal'
import { springService } from '@/core/api/services/spring-service'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

// Define validation schema for CallStatus
const callstatusSchema = z.object({
  
  
  name: z.string().min(2).max(50),
  
  
  
  code: z.string().min(2).max(10),
  
  
  
  description: z.string().max(255).optional(),
  
  
  
  isFinal: z.boolean(),
  
  
  
  isActive: z.boolean(),
  
  
  
  sortOrder: z.number().min(0).optional(),
  
  
  
  remark: z.string().max(1000).optional(),
  
  
  
  createdDate: z.string().datetime(),
  
  
  
  lastModifiedDate: z.string().datetime().optional(),
  
  
  
})

export type CallStatusFormData = z.infer<typeof callstatusSchema>

/**
 * Create a new CallStatus
 */
export async function createCallStatus(
  prevState: any,
  formData: FormData
): Promise<{ success?: boolean; error?: string; errors?: Record<string, string[]> }> {
  try {
    // Verify session and check permissions
    const session = await verifySession()
    const currentOrg = await getCurrentOrganization()
    
    if (!(await hasRole('callStatus:create'))) {
      return { error: 'Insufficient permissions to create call status' }
    }

    // Parse and validate form data
    const rawData = {
      
      
      name: formData.get('name') || undefined,
      
      
      
      code: formData.get('code') || undefined,
      
      
      
      description: formData.get('description') || undefined,
      
      
      
      isFinal: formData.get('isFinal') === 'true',
      
      
      
      isActive: formData.get('isActive') === 'true',
      
      
      
      sortOrder: formData.get('sortOrder') ? Number(formData.get('sortOrder')) : undefined,
      
      
      
      remark: formData.get('remark') || undefined,
      
      
      
      createdDate: formData.get('createdDate') || undefined,
      
      
      
      lastModifiedDate: formData.get('lastModifiedDate') || undefined,
      
      
      
    }

    const validatedData = callstatusSchema.parse(rawData)

    // Add organization context if available
    const dataWithOrg = currentOrg 
      ? { ...validatedData, organizationId: currentOrg.id }
      : validatedData

    // Create the entity
    await springService.post('/call-statuses', dataWithOrg)

    // Revalidate the list page
    revalidatePath('/call-statuses')
    
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
    
    console.error('Error creating CallStatus:', error)
    return { error: 'Failed to create call status. Please try again.' }
  }

  // Redirect to the list page on success
  redirect('/call-statuses')
}

/**
 * Update an existing CallStatus
 */
export async function updateCallStatus(
  id: number,
  prevState: any,
  formData: FormData
): Promise<{ success?: boolean; error?: string; errors?: Record<string, string[]> }> {
  try {
    // Verify session and check permissions
    const session = await verifySession()
    const currentOrg = await getCurrentOrganization()
    
    if (!(await hasRole('callStatus:update'))) {
      return { error: 'Insufficient permissions to update call status' }
    }

    // Parse and validate form data
    const rawData = {
      
      
      name: formData.get('name') || undefined,
      
      
      
      code: formData.get('code') || undefined,
      
      
      
      description: formData.get('description') || undefined,
      
      
      
      isFinal: formData.get('isFinal') === 'true',
      
      
      
      isActive: formData.get('isActive') === 'true',
      
      
      
      sortOrder: formData.get('sortOrder') ? Number(formData.get('sortOrder')) : undefined,
      
      
      
      remark: formData.get('remark') || undefined,
      
      
      
      createdDate: formData.get('createdDate') || undefined,
      
      
      
      lastModifiedDate: formData.get('lastModifiedDate') || undefined,
      
      
      
    }

    const validatedData = callstatusSchema.parse(rawData)

    // Add organization context if available
    const dataWithOrg = currentOrg 
      ? { ...validatedData, organizationId: currentOrg.id }
      : validatedData

    // Update the entity
    await springService.put(`/call-statuses/${id}`, { id, ...dataWithOrg })

    // Revalidate pages
    revalidatePath('/call-statuses')
    revalidatePath(`/call-statuses/${id}`)
    
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
    
    console.error('Error updating CallStatus:', error)
    return { error: 'Failed to update call status. Please try again.' }
  }

  // Redirect to the details page on success
  redirect(`/call-statuses/${id}`)
}

/**
 * Delete a CallStatus
 */
export async function deleteCallStatus(id: number): Promise<{ success?: boolean; error?: string }> {
  try {
    // Verify session and check permissions
    const session = await verifySession()
    
    if (!(await hasRole('callStatus:delete'))) {
      return { error: 'Insufficient permissions to delete call status' }
    }

    // Delete the entity
    await springService.delete(`/call-statuses/${id}`)

    // Revalidate the list page
    revalidatePath('/call-statuses')
    
    return { success: true }
  } catch (error) {
    console.error('Error deleting CallStatus:', error)
    return { error: 'Failed to delete call status. Please try again.' }
  }
}

/**
 * Get CallStatuses for current organization
 */
export async function getCallStatusesForOrganization() {
  try {
    const session = await verifySession()
    const currentOrg = await getCurrentOrganization()
    
    if (!(await hasRole('callStatus:read'))) {
      throw new Error('Insufficient permissions to read call statuses')
    }
    
    // Build query parameters with organization filter
    const params = currentOrg ? { organizationId: currentOrg.id } : {}
    
    const response = await springService.get('/call-statuses', { params })
    return response
  } catch (error) {
    console.error('Error fetching CallStatuses for organization:', error)
    throw error
  }
}
