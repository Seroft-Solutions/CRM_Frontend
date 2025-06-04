'use server'

import { verifySession, hasRole, getCurrentOrganization } from '@/lib/dal'
import { springService } from '@/core/api/services/spring-service'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

// Define validation schema for CallRemark
const callremarkSchema = z.object({
  
  
  remark: z.string().max(2000),
  
  
  
  dateTime: z.string().datetime(),
  
  
  
  
  callId: z.number().optional(),
  
  
})

export type CallRemarkFormData = z.infer<typeof callremarkSchema>

/**
 * Create a new CallRemark
 */
export async function createCallRemark(
  prevState: any,
  formData: FormData
): Promise<{ success?: boolean; error?: string; errors?: Record<string, string[]> }> {
  try {
    // Verify session and check permissions
    const session = await verifySession()
    const currentOrg = await getCurrentOrganization()
    
    if (!(await hasRole('callRemark:create'))) {
      return { error: 'Insufficient permissions to create call remark' }
    }

    // Parse and validate form data
    const rawData = {
      
      
      remark: formData.get('remark') || undefined,
      
      
      
      dateTime: formData.get('dateTime') || undefined,
      
      
      
      
      callId: formData.get('callId') ? Number(formData.get('callId')) : undefined,
      
      
    }

    const validatedData = callremarkSchema.parse(rawData)

    // Add organization context if available
    const dataWithOrg = currentOrg 
      ? { ...validatedData, organizationId: currentOrg.id }
      : validatedData

    // Create the entity
    await springService.post('/call-remarks', dataWithOrg)

    // Revalidate the list page
    revalidatePath('/call-remarks')
    
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
    
    console.error('Error creating CallRemark:', error)
    return { error: 'Failed to create call remark. Please try again.' }
  }

  // Redirect to the list page on success
  redirect('/call-remarks')
}

/**
 * Update an existing CallRemark
 */
export async function updateCallRemark(
  id: number,
  prevState: any,
  formData: FormData
): Promise<{ success?: boolean; error?: string; errors?: Record<string, string[]> }> {
  try {
    // Verify session and check permissions
    const session = await verifySession()
    const currentOrg = await getCurrentOrganization()
    
    if (!(await hasRole('callRemark:update'))) {
      return { error: 'Insufficient permissions to update call remark' }
    }

    // Parse and validate form data
    const rawData = {
      
      
      remark: formData.get('remark') || undefined,
      
      
      
      dateTime: formData.get('dateTime') || undefined,
      
      
      
      
      callId: formData.get('callId') ? Number(formData.get('callId')) : undefined,
      
      
    }

    const validatedData = callremarkSchema.parse(rawData)

    // Add organization context if available
    const dataWithOrg = currentOrg 
      ? { ...validatedData, organizationId: currentOrg.id }
      : validatedData

    // Update the entity
    await springService.put(`/call-remarks/${id}`, { id, ...dataWithOrg })

    // Revalidate pages
    revalidatePath('/call-remarks')
    revalidatePath(`/call-remarks/${id}`)
    
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
    
    console.error('Error updating CallRemark:', error)
    return { error: 'Failed to update call remark. Please try again.' }
  }

  // Redirect to the details page on success
  redirect(`/call-remarks/${id}`)
}

/**
 * Delete a CallRemark
 */
export async function deleteCallRemark(id: number): Promise<{ success?: boolean; error?: string }> {
  try {
    // Verify session and check permissions
    const session = await verifySession()
    
    if (!(await hasRole('callRemark:delete'))) {
      return { error: 'Insufficient permissions to delete call remark' }
    }

    // Delete the entity
    await springService.delete(`/call-remarks/${id}`)

    // Revalidate the list page
    revalidatePath('/call-remarks')
    
    return { success: true }
  } catch (error) {
    console.error('Error deleting CallRemark:', error)
    return { error: 'Failed to delete call remark. Please try again.' }
  }
}

/**
 * Get CallRemarks for current organization
 */
export async function getCallRemarksForOrganization() {
  try {
    const session = await verifySession()
    const currentOrg = await getCurrentOrganization()
    
    if (!(await hasRole('callRemark:read'))) {
      throw new Error('Insufficient permissions to read call remarks')
    }
    
    // Build query parameters with organization filter
    const params = currentOrg ? { organizationId: currentOrg.id } : {}
    
    const response = await springService.get('/call-remarks', { params })
    return response
  } catch (error) {
    console.error('Error fetching CallRemarks for organization:', error)
    throw error
  }
}
