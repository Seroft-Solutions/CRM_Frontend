'use server'

import { verifySession, hasRole, getCurrentOrganization } from '@/lib/dal'
import { springService } from '@/core/api/services/spring-service'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

// Define validation schema for Group
const groupSchema = z.object({
  
  
  keycloakGroupId: z.any(),
  
  
  
  name: z.string().min(2).max(100),
  
  
  
  path: z.string(),
  
  
  
  description: z.string().max(255).optional(),
  
  
  
  
  
})

export type GroupFormData = z.infer<typeof groupSchema>

/**
 * Create a new Group
 */
export async function createGroup(
  prevState: any,
  formData: FormData
): Promise<{ success?: boolean; error?: string; errors?: Record<string, string[]> }> {
  try {
    // Verify session and check permissions
    const session = await verifySession()
    const currentOrg = await getCurrentOrganization()
    
    if (!(await hasRole('group:create'))) {
      return { error: 'Insufficient permissions to create group' }
    }

    // Parse and validate form data
    const rawData = {
      
      
      keycloakGroupId: formData.get('keycloakGroupId') || undefined,
      
      
      
      name: formData.get('name') || undefined,
      
      
      
      path: formData.get('path') || undefined,
      
      
      
      description: formData.get('description') || undefined,
      
      
      
      
      
    }

    const validatedData = groupSchema.parse(rawData)

    // Add organization context if available
    const dataWithOrg = currentOrg 
      ? { ...validatedData, organizationId: currentOrg.id }
      : validatedData

    // Create the entity
    await springService.post('/groups', dataWithOrg)

    // Revalidate the list page
    revalidatePath('/groups')
    
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
    
    console.error('Error creating Group:', error)
    return { error: 'Failed to create group. Please try again.' }
  }

  // Redirect to the list page on success
  redirect('/groups')
}

/**
 * Update an existing Group
 */
export async function updateGroup(
  id: number,
  prevState: any,
  formData: FormData
): Promise<{ success?: boolean; error?: string; errors?: Record<string, string[]> }> {
  try {
    // Verify session and check permissions
    const session = await verifySession()
    const currentOrg = await getCurrentOrganization()
    
    if (!(await hasRole('group:update'))) {
      return { error: 'Insufficient permissions to update group' }
    }

    // Parse and validate form data
    const rawData = {
      
      
      keycloakGroupId: formData.get('keycloakGroupId') || undefined,
      
      
      
      name: formData.get('name') || undefined,
      
      
      
      path: formData.get('path') || undefined,
      
      
      
      description: formData.get('description') || undefined,
      
      
      
      
      
    }

    const validatedData = groupSchema.parse(rawData)

    // Add organization context if available
    const dataWithOrg = currentOrg 
      ? { ...validatedData, organizationId: currentOrg.id }
      : validatedData

    // Update the entity
    await springService.put(`/groups/${id}`, { id, ...dataWithOrg })

    // Revalidate pages
    revalidatePath('/groups')
    revalidatePath(`/groups/${id}`)
    
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
    
    console.error('Error updating Group:', error)
    return { error: 'Failed to update group. Please try again.' }
  }

  // Redirect to the details page on success
  redirect(`/groups/${id}`)
}

/**
 * Delete a Group
 */
export async function deleteGroup(id: number): Promise<{ success?: boolean; error?: string }> {
  try {
    // Verify session and check permissions
    const session = await verifySession()
    
    if (!(await hasRole('group:delete'))) {
      return { error: 'Insufficient permissions to delete group' }
    }

    // Delete the entity
    await springService.delete(`/groups/${id}`)

    // Revalidate the list page
    revalidatePath('/groups')
    
    return { success: true }
  } catch (error) {
    console.error('Error deleting Group:', error)
    return { error: 'Failed to delete group. Please try again.' }
  }
}

/**
 * Get Groups for current organization
 */
export async function getGroupsForOrganization() {
  try {
    const session = await verifySession()
    const currentOrg = await getCurrentOrganization()
    
    if (!(await hasRole('group:read'))) {
      throw new Error('Insufficient permissions to read groups')
    }
    
    // Build query parameters with organization filter
    const params = currentOrg ? { organizationId: currentOrg.id } : {}
    
    const response = await springService.get('/groups', { params })
    return response
  } catch (error) {
    console.error('Error fetching Groups for organization:', error)
    throw error
  }
}
