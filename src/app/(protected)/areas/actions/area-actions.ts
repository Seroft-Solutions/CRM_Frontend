'use server'

import { verifySession, hasRole, getCurrentOrganization } from '@/lib/dal'
import { springService } from '@/core/api/services/spring-service'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

// Define validation schema for Area
const areaSchema = z.object({
  
  
  name: z.string(),
  
  
  
  pincode: z.number(),
  
  
  
  
  cityId: z.number().optional(),
  
  
})

export type AreaFormData = z.infer<typeof areaSchema>

/**
 * Create a new Area
 */
export async function createArea(
  prevState: any,
  formData: FormData
): Promise<{ success?: boolean; error?: string; errors?: Record<string, string[]> }> {
  try {
    // Verify session and check permissions
    const session = await verifySession()
    const currentOrg = await getCurrentOrganization()
    
    if (!(await hasRole('area:create'))) {
      return { error: 'Insufficient permissions to create area' }
    }

    // Parse and validate form data
    const rawData = {
      
      
      name: formData.get('name') || undefined,
      
      
      
      pincode: formData.get('pincode') ? Number(formData.get('pincode')) : undefined,
      
      
      
      
      cityId: formData.get('cityId') ? Number(formData.get('cityId')) : undefined,
      
      
    }

    const validatedData = areaSchema.parse(rawData)

    // Add organization context if available
    const dataWithOrg = currentOrg 
      ? { ...validatedData, organizationId: currentOrg.id }
      : validatedData

    // Create the entity
    await springService.post('/areas', dataWithOrg)

    // Revalidate the list page
    revalidatePath('/areas')
    
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
    
    console.error('Error creating Area:', error)
    return { error: 'Failed to create area. Please try again.' }
  }

  // Redirect to the list page on success
  redirect('/areas')
}

/**
 * Update an existing Area
 */
export async function updateArea(
  id: number,
  prevState: any,
  formData: FormData
): Promise<{ success?: boolean; error?: string; errors?: Record<string, string[]> }> {
  try {
    // Verify session and check permissions
    const session = await verifySession()
    const currentOrg = await getCurrentOrganization()
    
    if (!(await hasRole('area:update'))) {
      return { error: 'Insufficient permissions to update area' }
    }

    // Parse and validate form data
    const rawData = {
      
      
      name: formData.get('name') || undefined,
      
      
      
      pincode: formData.get('pincode') ? Number(formData.get('pincode')) : undefined,
      
      
      
      
      cityId: formData.get('cityId') ? Number(formData.get('cityId')) : undefined,
      
      
    }

    const validatedData = areaSchema.parse(rawData)

    // Add organization context if available
    const dataWithOrg = currentOrg 
      ? { ...validatedData, organizationId: currentOrg.id }
      : validatedData

    // Update the entity
    await springService.put(`/areas/${id}`, { id, ...dataWithOrg })

    // Revalidate pages
    revalidatePath('/areas')
    revalidatePath(`/areas/${id}`)
    
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
    
    console.error('Error updating Area:', error)
    return { error: 'Failed to update area. Please try again.' }
  }

  // Redirect to the details page on success
  redirect(`/areas/${id}`)
}

/**
 * Delete a Area
 */
export async function deleteArea(id: number): Promise<{ success?: boolean; error?: string }> {
  try {
    // Verify session and check permissions
    const session = await verifySession()
    
    if (!(await hasRole('area:delete'))) {
      return { error: 'Insufficient permissions to delete area' }
    }

    // Delete the entity
    await springService.delete(`/areas/${id}`)

    // Revalidate the list page
    revalidatePath('/areas')
    
    return { success: true }
  } catch (error) {
    console.error('Error deleting Area:', error)
    return { error: 'Failed to delete area. Please try again.' }
  }
}

/**
 * Get Areas for current organization
 */
export async function getAreasForOrganization() {
  try {
    const session = await verifySession()
    const currentOrg = await getCurrentOrganization()
    
    if (!(await hasRole('area:read'))) {
      throw new Error('Insufficient permissions to read areas')
    }
    
    // Build query parameters with organization filter
    const params = currentOrg ? { organizationId: currentOrg.id } : {}
    
    const response = await springService.get('/areas', { params })
    return response
  } catch (error) {
    console.error('Error fetching Areas for organization:', error)
    throw error
  }
}
