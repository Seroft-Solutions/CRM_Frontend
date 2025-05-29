'use server'

import { verifySession, hasRole, getCurrentOrganization } from '@/lib/dal'
import { springService } from '@/core/api/services/spring-service'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

// Define validation schema for Source
const sourceSchema = z.object({
  
  
  name: z.string(),
  
  
  
  description: z.string().optional(),
  
  
  
  remark: z.any().optional(),
  
  
  
})

export type SourceFormData = z.infer<typeof sourceSchema>

/**
 * Create a new Source
 */
export async function createSource(
  prevState: any,
  formData: FormData
): Promise<{ success?: boolean; error?: string; errors?: Record<string, string[]> }> {
  try {
    // Verify session and check permissions
    const session = await verifySession()
    const currentOrg = await getCurrentOrganization()
    
    if (!(await hasRole('source:create'))) {
      return { error: 'Insufficient permissions to create source' }
    }

    // Parse and validate form data
    const rawData = {
      
      
      name: formData.get('name') || undefined,
      
      
      
      description: formData.get('description') || undefined,
      
      
      
      remark: formData.get('remark') || undefined,
      
      
      
    }

    const validatedData = sourceSchema.parse(rawData)

    // Add organization context if available
    const dataWithOrg = currentOrg 
      ? { ...validatedData, organizationId: currentOrg.id }
      : validatedData

    // Create the entity
    await springService.post('/sources', dataWithOrg)

    // Revalidate the list page
    revalidatePath('/sources')
    
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
    
    console.error('Error creating Source:', error)
    return { error: 'Failed to create source. Please try again.' }
  }

  // Redirect to the list page on success
  redirect('/sources')
}

/**
 * Update an existing Source
 */
export async function updateSource(
  id: number,
  prevState: any,
  formData: FormData
): Promise<{ success?: boolean; error?: string; errors?: Record<string, string[]> }> {
  try {
    // Verify session and check permissions
    const session = await verifySession()
    const currentOrg = await getCurrentOrganization()
    
    if (!(await hasRole('source:update'))) {
      return { error: 'Insufficient permissions to update source' }
    }

    // Parse and validate form data
    const rawData = {
      
      
      name: formData.get('name') || undefined,
      
      
      
      description: formData.get('description') || undefined,
      
      
      
      remark: formData.get('remark') || undefined,
      
      
      
    }

    const validatedData = sourceSchema.parse(rawData)

    // Add organization context if available
    const dataWithOrg = currentOrg 
      ? { ...validatedData, organizationId: currentOrg.id }
      : validatedData

    // Update the entity
    await springService.put(`/sources/${id}`, { id, ...dataWithOrg })

    // Revalidate pages
    revalidatePath('/sources')
    revalidatePath(`/sources/${id}`)
    
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
    
    console.error('Error updating Source:', error)
    return { error: 'Failed to update source. Please try again.' }
  }

  // Redirect to the details page on success
  redirect(`/sources/${id}`)
}

/**
 * Delete a Source
 */
export async function deleteSource(id: number): Promise<{ success?: boolean; error?: string }> {
  try {
    // Verify session and check permissions
    const session = await verifySession()
    
    if (!(await hasRole('source:delete'))) {
      return { error: 'Insufficient permissions to delete source' }
    }

    // Delete the entity
    await springService.delete(`/sources/${id}`)

    // Revalidate the list page
    revalidatePath('/sources')
    
    return { success: true }
  } catch (error) {
    console.error('Error deleting Source:', error)
    return { error: 'Failed to delete source. Please try again.' }
  }
}

/**
 * Get Sources for current organization
 */
export async function getSourcesForOrganization() {
  try {
    const session = await verifySession()
    const currentOrg = await getCurrentOrganization()
    
    if (!(await hasRole('source:read'))) {
      throw new Error('Insufficient permissions to read sources')
    }
    
    // Build query parameters with organization filter
    const params = currentOrg ? { organizationId: currentOrg.id } : {}
    
    const response = await springService.get('/sources', { params })
    return response
  } catch (error) {
    console.error('Error fetching Sources for organization:', error)
    throw error
  }
}
