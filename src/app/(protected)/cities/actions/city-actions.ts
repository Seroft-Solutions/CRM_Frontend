'use server'

import { verifySession, hasRole, getCurrentOrganization } from '@/lib/dal'
import { springService } from '@/core/api/services/spring-service'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

// Define validation schema for City
const citySchema = z.object({
  
  
  name: z.string().min(2).max(100),
  
  
  
  code: z.string().min(2).max(10).optional(),
  
  
  
  isMetro: z.boolean(),
  
  
  
  population: z.number().min(0).optional(),
  
  
  
  isActive: z.boolean(),
  
  
  
  createdDate: z.string().datetime(),
  
  
  
  lastModifiedDate: z.string().datetime().optional(),
  
  
  
  
  districtId: z.number().optional(),
  
  
})

export type CityFormData = z.infer<typeof citySchema>

/**
 * Create a new City
 */
export async function createCity(
  prevState: any,
  formData: FormData
): Promise<{ success?: boolean; error?: string; errors?: Record<string, string[]> }> {
  try {
    // Verify session and check permissions
    const session = await verifySession()
    const currentOrg = await getCurrentOrganization()
    
    if (!(await hasRole('city:create'))) {
      return { error: 'Insufficient permissions to create city' }
    }

    // Parse and validate form data
    const rawData = {
      
      
      name: formData.get('name') || undefined,
      
      
      
      code: formData.get('code') || undefined,
      
      
      
      isMetro: formData.get('isMetro') === 'true',
      
      
      
      population: formData.get('population') ? Number(formData.get('population')) : undefined,
      
      
      
      isActive: formData.get('isActive') === 'true',
      
      
      
      createdDate: formData.get('createdDate') || undefined,
      
      
      
      lastModifiedDate: formData.get('lastModifiedDate') || undefined,
      
      
      
      
      districtId: formData.get('districtId') ? Number(formData.get('districtId')) : undefined,
      
      
    }

    const validatedData = citySchema.parse(rawData)

    // Add organization context if available
    const dataWithOrg = currentOrg 
      ? { ...validatedData, organizationId: currentOrg.id }
      : validatedData

    // Create the entity
    await springService.post('/cities', dataWithOrg)

    // Revalidate the list page
    revalidatePath('/cities')
    
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
    
    console.error('Error creating City:', error)
    return { error: 'Failed to create city. Please try again.' }
  }

  // Redirect to the list page on success
  redirect('/cities')
}

/**
 * Update an existing City
 */
export async function updateCity(
  id: number,
  prevState: any,
  formData: FormData
): Promise<{ success?: boolean; error?: string; errors?: Record<string, string[]> }> {
  try {
    // Verify session and check permissions
    const session = await verifySession()
    const currentOrg = await getCurrentOrganization()
    
    if (!(await hasRole('city:update'))) {
      return { error: 'Insufficient permissions to update city' }
    }

    // Parse and validate form data
    const rawData = {
      
      
      name: formData.get('name') || undefined,
      
      
      
      code: formData.get('code') || undefined,
      
      
      
      isMetro: formData.get('isMetro') === 'true',
      
      
      
      population: formData.get('population') ? Number(formData.get('population')) : undefined,
      
      
      
      isActive: formData.get('isActive') === 'true',
      
      
      
      createdDate: formData.get('createdDate') || undefined,
      
      
      
      lastModifiedDate: formData.get('lastModifiedDate') || undefined,
      
      
      
      
      districtId: formData.get('districtId') ? Number(formData.get('districtId')) : undefined,
      
      
    }

    const validatedData = citySchema.parse(rawData)

    // Add organization context if available
    const dataWithOrg = currentOrg 
      ? { ...validatedData, organizationId: currentOrg.id }
      : validatedData

    // Update the entity
    await springService.put(`/cities/${id}`, { id, ...dataWithOrg })

    // Revalidate pages
    revalidatePath('/cities')
    revalidatePath(`/cities/${id}`)
    
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
    
    console.error('Error updating City:', error)
    return { error: 'Failed to update city. Please try again.' }
  }

  // Redirect to the details page on success
  redirect(`/cities/${id}`)
}

/**
 * Delete a City
 */
export async function deleteCity(id: number): Promise<{ success?: boolean; error?: string }> {
  try {
    // Verify session and check permissions
    const session = await verifySession()
    
    if (!(await hasRole('city:delete'))) {
      return { error: 'Insufficient permissions to delete city' }
    }

    // Delete the entity
    await springService.delete(`/cities/${id}`)

    // Revalidate the list page
    revalidatePath('/cities')
    
    return { success: true }
  } catch (error) {
    console.error('Error deleting City:', error)
    return { error: 'Failed to delete city. Please try again.' }
  }
}

/**
 * Get Cities for current organization
 */
export async function getCitiesForOrganization() {
  try {
    const session = await verifySession()
    const currentOrg = await getCurrentOrganization()
    
    if (!(await hasRole('city:read'))) {
      throw new Error('Insufficient permissions to read cities')
    }
    
    // Build query parameters with organization filter
    const params = currentOrg ? { organizationId: currentOrg.id } : {}
    
    const response = await springService.get('/cities', { params })
    return response
  } catch (error) {
    console.error('Error fetching Cities for organization:', error)
    throw error
  }
}
