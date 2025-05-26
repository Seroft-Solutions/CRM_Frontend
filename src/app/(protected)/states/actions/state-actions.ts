'use server'

import { verifySession, hasRole, getCurrentOrganization } from '@/lib/dal'
import { springService } from '@/core/api/services/spring-service'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

// Define validation schema for State
const stateSchema = z.object({
  
  
  name: z.string(),
  
  
  
})

export type StateFormData = z.infer<typeof stateSchema>

/**
 * Create a new State
 */
export async function createState(
  prevState: any,
  formData: FormData
): Promise<{ success?: boolean; error?: string; errors?: Record<string, string[]> }> {
  try {
    // Verify session and check permissions
    const session = await verifySession()
    const currentOrg = await getCurrentOrganization()
    
    if (!(await hasRole('state:create'))) {
      return { error: 'Insufficient permissions to create state' }
    }

    // Parse and validate form data
    const rawData = {
      
      
      name: formData.get('name') || undefined,
      
      
      
    }

    const validatedData = stateSchema.parse(rawData)

    // Add organization context if available
    const dataWithOrg = currentOrg 
      ? { ...validatedData, organizationId: currentOrg.id }
      : validatedData

    // Create the entity
    await springService.post('/states', dataWithOrg)

    // Revalidate the list page
    revalidatePath('/states')
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        errors: error.flatten().fieldErrors
      }
    }
    
    console.error('Error creating State:', error)
    return { error: 'Failed to create state. Please try again.' }
  }

  // Redirect to the list page on success
  redirect('/states')
}

/**
 * Update an existing State
 */
export async function updateState(
  id: number,
  prevState: any,
  formData: FormData
): Promise<{ success?: boolean; error?: string; errors?: Record<string, string[]> }> {
  try {
    // Verify session and check permissions
    const session = await verifySession()
    const currentOrg = await getCurrentOrganization()
    
    if (!(await hasRole('state:update'))) {
      return { error: 'Insufficient permissions to update state' }
    }

    // Parse and validate form data
    const rawData = {
      
      
      name: formData.get('name') || undefined,
      
      
      
    }

    const validatedData = stateSchema.parse(rawData)

    // Add organization context if available
    const dataWithOrg = currentOrg 
      ? { ...validatedData, organizationId: currentOrg.id }
      : validatedData

    // Update the entity
    await springService.put(`/states/${id}`, { id, ...dataWithOrg })

    // Revalidate pages
    revalidatePath('/states')
    revalidatePath(`/states/${id}`)
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        errors: error.flatten().fieldErrors
      }
    }
    
    console.error('Error updating State:', error)
    return { error: 'Failed to update state. Please try again.' }
  }

  // Redirect to the details page on success
  redirect(`/states/${id}`)
}

/**
 * Delete a State
 */
export async function deleteState(id: number): Promise<{ success?: boolean; error?: string }> {
  try {
    // Verify session and check permissions
    const session = await verifySession()
    
    if (!(await hasRole('state:delete'))) {
      return { error: 'Insufficient permissions to delete state' }
    }

    // Delete the entity
    await springService.delete(`/states/${id}`)

    // Revalidate the list page
    revalidatePath('/states')
    
    return { success: true }
  } catch (error) {
    console.error('Error deleting State:', error)
    return { error: 'Failed to delete state. Please try again.' }
  }
}

/**
 * Get States for current organization
 */
export async function getStatesForOrganization() {
  try {
    const session = await verifySession()
    const currentOrg = await getCurrentOrganization()
    
    if (!(await hasRole('state:read'))) {
      throw new Error('Insufficient permissions to read states')
    }
    
    // Build query parameters with organization filter
    const params = currentOrg ? { organizationId: currentOrg.id } : {}
    
    const response = await springService.get('/states', { params })
    return response
  } catch (error) {
    console.error('Error fetching States for organization:', error)
    throw error
  }
}
