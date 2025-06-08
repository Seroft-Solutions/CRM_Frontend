'use server'

import { verifySession, hasRole, getCurrentOrganization } from '@/lib/dal'
import { springService } from '@/core/api/services/spring-service'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

// Define validation schema for UserProfile
const userprofileSchema = z.object({
  
  
  keycloakId: z.any(),
  
  
  
  email: z.string().min(5).max(100),
  
  
  
  firstName: z.string().max(50).optional(),
  
  
  
  lastName: z.string().max(50).optional(),
  
  
  
  isActive: z.boolean(),
  
  
  
  createdDate: z.string().datetime().optional(),
  
  
  
  
  
  
  
  
  
})

export type UserProfileFormData = z.infer<typeof userprofileSchema>

/**
 * Create a new UserProfile
 */
export async function createUserProfile(
  prevState: any,
  formData: FormData
): Promise<{ success?: boolean; error?: string; errors?: Record<string, string[]> }> {
  try {
    // Verify session and check permissions
    const session = await verifySession()
    const currentOrg = await getCurrentOrganization()
    
    if (!(await hasRole('userProfile:create'))) {
      return { error: 'Insufficient permissions to create user profile' }
    }

    // Parse and validate form data
    const rawData = {
      
      
      keycloakId: formData.get('keycloakId') || undefined,
      
      
      
      email: formData.get('email') || undefined,
      
      
      
      firstName: formData.get('firstName') || undefined,
      
      
      
      lastName: formData.get('lastName') || undefined,
      
      
      
      isActive: formData.get('isActive') === 'true',
      
      
      
      createdDate: formData.get('createdDate') || undefined,
      
      
      
      
      
      
      
      
      
    }

    const validatedData = userprofileSchema.parse(rawData)

    // Add organization context if available
    const dataWithOrg = currentOrg 
      ? { ...validatedData, organizationId: currentOrg.id }
      : validatedData

    // Create the entity
    await springService.post('/user-profiles', dataWithOrg)

    // Revalidate the list page
    revalidatePath('/user-profiles')
    
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
    
    console.error('Error creating UserProfile:', error)
    return { error: 'Failed to create user profile. Please try again.' }
  }

  // Redirect to the list page on success
  redirect('/user-profiles')
}

/**
 * Update an existing UserProfile
 */
export async function updateUserProfile(
  id: number,
  prevState: any,
  formData: FormData
): Promise<{ success?: boolean; error?: string; errors?: Record<string, string[]> }> {
  try {
    // Verify session and check permissions
    const session = await verifySession()
    const currentOrg = await getCurrentOrganization()
    
    if (!(await hasRole('userProfile:update'))) {
      return { error: 'Insufficient permissions to update user profile' }
    }

    // Parse and validate form data
    const rawData = {
      
      
      keycloakId: formData.get('keycloakId') || undefined,
      
      
      
      email: formData.get('email') || undefined,
      
      
      
      firstName: formData.get('firstName') || undefined,
      
      
      
      lastName: formData.get('lastName') || undefined,
      
      
      
      isActive: formData.get('isActive') === 'true',
      
      
      
      createdDate: formData.get('createdDate') || undefined,
      
      
      
      
      
      
      
      
      
    }

    const validatedData = userprofileSchema.parse(rawData)

    // Add organization context if available
    const dataWithOrg = currentOrg 
      ? { ...validatedData, organizationId: currentOrg.id }
      : validatedData

    // Update the entity
    await springService.put(`/user-profiles/${id}`, { id, ...dataWithOrg })

    // Revalidate pages
    revalidatePath('/user-profiles')
    revalidatePath(`/user-profiles/${id}`)
    
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
    
    console.error('Error updating UserProfile:', error)
    return { error: 'Failed to update user profile. Please try again.' }
  }

  // Redirect to the details page on success
  redirect(`/user-profiles/${id}`)
}

/**
 * Delete a UserProfile
 */
export async function deleteUserProfile(id: number): Promise<{ success?: boolean; error?: string }> {
  try {
    // Verify session and check permissions
    const session = await verifySession()
    
    if (!(await hasRole('userProfile:delete'))) {
      return { error: 'Insufficient permissions to delete user profile' }
    }

    // Delete the entity
    await springService.delete(`/user-profiles/${id}`)

    // Revalidate the list page
    revalidatePath('/user-profiles')
    
    return { success: true }
  } catch (error) {
    console.error('Error deleting UserProfile:', error)
    return { error: 'Failed to delete user profile. Please try again.' }
  }
}

/**
 * Get UserProfiles for current organization
 */
export async function getUserProfilesForOrganization() {
  try {
    const session = await verifySession()
    const currentOrg = await getCurrentOrganization()
    
    if (!(await hasRole('userProfile:read'))) {
      throw new Error('Insufficient permissions to read user profiles')
    }
    
    // Build query parameters with organization filter
    const params = currentOrg ? { organizationId: currentOrg.id } : {}
    
    const response = await springService.get('/user-profiles', { params })
    return response
  } catch (error) {
    console.error('Error fetching UserProfiles for organization:', error)
    throw error
  }
}
