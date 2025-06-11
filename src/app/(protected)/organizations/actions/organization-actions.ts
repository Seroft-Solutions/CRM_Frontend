'use server'

import { verifySession, hasRole, getCurrentOrganization } from '@/lib/dal'
import { springService } from '@/core/api/services/spring-service'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

// Define validation schema for Organization
const organizationSchema = z.object({
  
  
  keycloakOrgId: z.any(),
  
  
  
  name: z.string().min(2).max(100),
  
  
  
  displayName: z.string().max(150).optional(),
  
  
  
  domain: z.string().max(100).optional(),
  
  
  
})

export type OrganizationFormData = z.infer<typeof organizationSchema>

/**
 * Create a new Organization
 */
export async function createOrganization(
  prevState: any,
  formData: FormData
): Promise<{ success?: boolean; error?: string; errors?: Record<string, string[]> }> {
  try {
    // Verify session and check permissions
    const session = await verifySession()
    const currentOrg = await getCurrentOrganization()
    
    if (!(await hasRole('organization:create'))) {
      return { error: 'Insufficient permissions to create organization' }
    }

    // Parse and validate form data
    const rawData = {
      
      
      keycloakOrgId: formData.get('keycloakOrgId') || undefined,
      
      
      
      name: formData.get('name') || undefined,
      
      
      
      displayName: formData.get('displayName') || undefined,
      
      
      
      domain: formData.get('domain') || undefined,
      
      
      
    }

    const validatedData = organizationSchema.parse(rawData)

    // Add organization context if available
    const dataWithOrg = currentOrg 
      ? { ...validatedData, organizationId: currentOrg.id }
      : validatedData

    // Create the entity
    await springService.post('/organizations', dataWithOrg)

    // Revalidate the list page
    revalidatePath('/organizations')
    
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
    
    console.error('Error creating Organization:', error)
    return { error: 'Failed to create organization. Please try again.' }
  }

  // Redirect to the list page on success
  redirect('/organizations')
}

/**
 * Update an existing Organization
 */
export async function updateOrganization(
  id: number,
  prevState: any,
  formData: FormData
): Promise<{ success?: boolean; error?: string; errors?: Record<string, string[]> }> {
  try {
    // Verify session and check permissions
    const session = await verifySession()
    const currentOrg = await getCurrentOrganization()
    
    if (!(await hasRole('organization:update'))) {
      return { error: 'Insufficient permissions to update organization' }
    }

    // Parse and validate form data
    const rawData = {
      
      
      keycloakOrgId: formData.get('keycloakOrgId') || undefined,
      
      
      
      name: formData.get('name') || undefined,
      
      
      
      displayName: formData.get('displayName') || undefined,
      
      
      
      domain: formData.get('domain') || undefined,
      
      
      
    }

    const validatedData = organizationSchema.parse(rawData)

    // Add organization context if available
    const dataWithOrg = currentOrg 
      ? { ...validatedData, organizationId: currentOrg.id }
      : validatedData

    // Update the entity
    await springService.put(`/organizations/${id}`, { id, ...dataWithOrg })

    // Revalidate pages
    revalidatePath('/organizations')
    revalidatePath(`/organizations/${id}`)
    
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
    
    console.error('Error updating Organization:', error)
    return { error: 'Failed to update organization. Please try again.' }
  }

  // Redirect to the details page on success
  redirect(`/organizations/${id}`)
}

/**
 * Delete a Organization
 */
export async function deleteOrganization(id: number): Promise<{ success?: boolean; error?: string }> {
  try {
    // Verify session and check permissions
    const session = await verifySession()
    
    if (!(await hasRole('organization:delete'))) {
      return { error: 'Insufficient permissions to delete organization' }
    }

    // Delete the entity
    await springService.delete(`/organizations/${id}`)

    // Revalidate the list page
    revalidatePath('/organizations')
    
    return { success: true }
  } catch (error) {
    console.error('Error deleting Organization:', error)
    return { error: 'Failed to delete organization. Please try again.' }
  }
}

/**
 * Get Organizations for current organization
 */
export async function getOrganizationsForOrganization() {
  try {
    const session = await verifySession()
    const currentOrg = await getCurrentOrganization()
    
    if (!(await hasRole('organization:read'))) {
      throw new Error('Insufficient permissions to read organizations')
    }
    
    // Build query parameters with organization filter
    const params = currentOrg ? { organizationId: currentOrg.id } : {}
    
    const response = await springService.get('/organizations', { params })
    return response
  } catch (error) {
    console.error('Error fetching Organizations for organization:', error)
    throw error
  }
}
