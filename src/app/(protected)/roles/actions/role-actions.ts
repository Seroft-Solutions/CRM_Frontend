'use server'

import { verifySession, hasRole, getCurrentOrganization } from '@/lib/dal'
import { springService } from '@/core/api/services/spring-service'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

// Define validation schema for Role
const roleSchema = z.object({
  
  
  name: z.string().min(2).max(50),
  
  
  
  description: z.string().max(200).optional(),
  
  
  
  
  
})

export type RoleFormData = z.infer<typeof roleSchema>

/**
 * Create a new Role
 */
export async function createRole(
  prevState: any,
  formData: FormData
): Promise<{ success?: boolean; error?: string; errors?: Record<string, string[]> }> {
  try {
    // Verify session and check permissions
    const session = await verifySession()
    const currentOrg = await getCurrentOrganization()
    
    if (!(await hasRole('role:create'))) {
      return { error: 'Insufficient permissions to create role' }
    }

    // Parse and validate form data
    const rawData = {
      
      
      name: formData.get('name') || undefined,
      
      
      
      description: formData.get('description') || undefined,
      
      
      
      
      
    }

    const validatedData = roleSchema.parse(rawData)

    // Add organization context if available
    const dataWithOrg = currentOrg 
      ? { ...validatedData, organizationId: currentOrg.id }
      : validatedData

    // Create the entity
    await springService.post('/roles', dataWithOrg)

    // Revalidate the list page
    revalidatePath('/roles')
    
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
    
    console.error('Error creating Role:', error)
    return { error: 'Failed to create role. Please try again.' }
  }

  // Redirect to the list page on success
  redirect('/roles')
}

/**
 * Update an existing Role
 */
export async function updateRole(
  id: number,
  prevState: any,
  formData: FormData
): Promise<{ success?: boolean; error?: string; errors?: Record<string, string[]> }> {
  try {
    // Verify session and check permissions
    const session = await verifySession()
    const currentOrg = await getCurrentOrganization()
    
    if (!(await hasRole('role:update'))) {
      return { error: 'Insufficient permissions to update role' }
    }

    // Parse and validate form data
    const rawData = {
      
      
      name: formData.get('name') || undefined,
      
      
      
      description: formData.get('description') || undefined,
      
      
      
      
      
    }

    const validatedData = roleSchema.parse(rawData)

    // Add organization context if available
    const dataWithOrg = currentOrg 
      ? { ...validatedData, organizationId: currentOrg.id }
      : validatedData

    // Update the entity
    await springService.put(`/roles/${id}`, { id, ...dataWithOrg })

    // Revalidate pages
    revalidatePath('/roles')
    revalidatePath(`/roles/${id}`)
    
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
    
    console.error('Error updating Role:', error)
    return { error: 'Failed to update role. Please try again.' }
  }

  // Redirect to the details page on success
  redirect(`/roles/${id}`)
}

/**
 * Delete a Role
 */
export async function deleteRole(id: number): Promise<{ success?: boolean; error?: string }> {
  try {
    // Verify session and check permissions
    const session = await verifySession()
    
    if (!(await hasRole('role:delete'))) {
      return { error: 'Insufficient permissions to delete role' }
    }

    // Delete the entity
    await springService.delete(`/roles/${id}`)

    // Revalidate the list page
    revalidatePath('/roles')
    
    return { success: true }
  } catch (error) {
    console.error('Error deleting Role:', error)
    return { error: 'Failed to delete role. Please try again.' }
  }
}

/**
 * Get Roles for current organization
 */
export async function getRolesForOrganization() {
  try {
    const session = await verifySession()
    const currentOrg = await getCurrentOrganization()
    
    if (!(await hasRole('role:read'))) {
      throw new Error('Insufficient permissions to read roles')
    }
    
    // Build query parameters with organization filter
    const params = currentOrg ? { organizationId: currentOrg.id } : {}
    
    const response = await springService.get('/roles', { params })
    return response
  } catch (error) {
    console.error('Error fetching Roles for organization:', error)
    throw error
  }
}
