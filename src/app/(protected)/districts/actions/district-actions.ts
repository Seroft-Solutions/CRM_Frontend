'use server'

import { verifySession, hasRole, getCurrentOrganization } from '@/lib/dal'
import { springService } from '@/core/api/services/spring-service'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

// Define validation schema for District
const districtSchema = z.object({
  
  
  name: z.string(),
  
  
  
  
  stateId: z.number().optional(),
  
  
})

export type DistrictFormData = z.infer<typeof districtSchema>

/**
 * Create a new District
 */
export async function createDistrict(
  prevState: any,
  formData: FormData
): Promise<{ success?: boolean; error?: string; errors?: Record<string, string[]> }> {
  try {
    // Verify session and check permissions
    const session = await verifySession()
    const currentOrg = await getCurrentOrganization()
    
    if (!(await hasRole('district:create'))) {
      return { error: 'Insufficient permissions to create district' }
    }

    // Parse and validate form data
    const rawData = {
      
      
      name: formData.get('name') || undefined,
      
      
      
      
      stateId: formData.get('stateId') ? Number(formData.get('stateId')) : undefined,
      
      
    }

    const validatedData = districtSchema.parse(rawData)

    // Add organization context if available
    const dataWithOrg = currentOrg 
      ? { ...validatedData, organizationId: currentOrg.id }
      : validatedData

    // Create the entity
    await springService.post('/districts', dataWithOrg)

    // Revalidate the list page
    revalidatePath('/districts')
    
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
    
    console.error('Error creating District:', error)
    return { error: 'Failed to create district. Please try again.' }
  }

  // Redirect to the list page on success
  redirect('/districts')
}

/**
 * Update an existing District
 */
export async function updateDistrict(
  id: number,
  prevState: any,
  formData: FormData
): Promise<{ success?: boolean; error?: string; errors?: Record<string, string[]> }> {
  try {
    // Verify session and check permissions
    const session = await verifySession()
    const currentOrg = await getCurrentOrganization()
    
    if (!(await hasRole('district:update'))) {
      return { error: 'Insufficient permissions to update district' }
    }

    // Parse and validate form data
    const rawData = {
      
      
      name: formData.get('name') || undefined,
      
      
      
      
      stateId: formData.get('stateId') ? Number(formData.get('stateId')) : undefined,
      
      
    }

    const validatedData = districtSchema.parse(rawData)

    // Add organization context if available
    const dataWithOrg = currentOrg 
      ? { ...validatedData, organizationId: currentOrg.id }
      : validatedData

    // Update the entity
    await springService.put(`/districts/${id}`, { id, ...dataWithOrg })

    // Revalidate pages
    revalidatePath('/districts')
    revalidatePath(`/districts/${id}`)
    
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
    
    console.error('Error updating District:', error)
    return { error: 'Failed to update district. Please try again.' }
  }

  // Redirect to the details page on success
  redirect(`/districts/${id}`)
}

/**
 * Delete a District
 */
export async function deleteDistrict(id: number): Promise<{ success?: boolean; error?: string }> {
  try {
    // Verify session and check permissions
    const session = await verifySession()
    
    if (!(await hasRole('district:delete'))) {
      return { error: 'Insufficient permissions to delete district' }
    }

    // Delete the entity
    await springService.delete(`/districts/${id}`)

    // Revalidate the list page
    revalidatePath('/districts')
    
    return { success: true }
  } catch (error) {
    console.error('Error deleting District:', error)
    return { error: 'Failed to delete district. Please try again.' }
  }
}

/**
 * Get Districts for current organization
 */
export async function getDistrictsForOrganization() {
  try {
    const session = await verifySession()
    const currentOrg = await getCurrentOrganization()
    
    if (!(await hasRole('district:read'))) {
      throw new Error('Insufficient permissions to read districts')
    }
    
    // Build query parameters with organization filter
    const params = currentOrg ? { organizationId: currentOrg.id } : {}
    
    const response = await springService.get('/districts', { params })
    return response
  } catch (error) {
    console.error('Error fetching Districts for organization:', error)
    throw error
  }
}
