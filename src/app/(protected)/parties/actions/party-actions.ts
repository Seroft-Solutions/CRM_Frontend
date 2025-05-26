'use server'

import { verifySession, hasRole, getCurrentOrganization } from '@/lib/dal'
import { springService } from '@/core/api/services/spring-service'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

// Define validation schema for Party
const partySchema = z.object({
  
  
  name: z.string(),
  
  
  
  mobile: z.string().optional(),
  
  
  
  email: z.string().optional(),
  
  
  
  whatsApp: z.string().optional(),
  
  
  
  contactPerson: z.string().optional(),
  
  
  
  address1: z.string().optional(),
  
  
  
  address2: z.string().optional(),
  
  
  
  address3: z.string().optional(),
  
  
  
  remark: z.any().optional(),
  
  
  
  
  cityId: z.number().optional(),
  
  
})

export type PartyFormData = z.infer<typeof partySchema>

/**
 * Create a new Party
 */
export async function createParty(
  prevState: any,
  formData: FormData
): Promise<{ success?: boolean; error?: string; errors?: Record<string, string[]> }> {
  try {
    // Verify session and check permissions
    const session = await verifySession()
    const currentOrg = await getCurrentOrganization()
    
    if (!(await hasRole('party:create'))) {
      return { error: 'Insufficient permissions to create party' }
    }

    // Parse and validate form data
    const rawData = {
      
      
      name: formData.get('name') || undefined,
      
      
      
      mobile: formData.get('mobile') || undefined,
      
      
      
      email: formData.get('email') || undefined,
      
      
      
      whatsApp: formData.get('whatsApp') || undefined,
      
      
      
      contactPerson: formData.get('contactPerson') || undefined,
      
      
      
      address1: formData.get('address1') || undefined,
      
      
      
      address2: formData.get('address2') || undefined,
      
      
      
      address3: formData.get('address3') || undefined,
      
      
      
      remark: formData.get('remark') || undefined,
      
      
      
      
      cityId: formData.get('cityId') ? Number(formData.get('cityId')) : undefined,
      
      
    }

    const validatedData = partySchema.parse(rawData)

    // Add organization context if available
    const dataWithOrg = currentOrg 
      ? { ...validatedData, organizationId: currentOrg.id }
      : validatedData

    // Create the entity
    await springService.post('/parties', dataWithOrg)

    // Revalidate the list page
    revalidatePath('/parties')
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        errors: error.flatten().fieldErrors
      }
    }
    
    console.error('Error creating Party:', error)
    return { error: 'Failed to create party. Please try again.' }
  }

  // Redirect to the list page on success
  redirect('/parties')
}

/**
 * Update an existing Party
 */
export async function updateParty(
  id: number,
  prevState: any,
  formData: FormData
): Promise<{ success?: boolean; error?: string; errors?: Record<string, string[]> }> {
  try {
    // Verify session and check permissions
    const session = await verifySession()
    const currentOrg = await getCurrentOrganization()
    
    if (!(await hasRole('party:update'))) {
      return { error: 'Insufficient permissions to update party' }
    }

    // Parse and validate form data
    const rawData = {
      
      
      name: formData.get('name') || undefined,
      
      
      
      mobile: formData.get('mobile') || undefined,
      
      
      
      email: formData.get('email') || undefined,
      
      
      
      whatsApp: formData.get('whatsApp') || undefined,
      
      
      
      contactPerson: formData.get('contactPerson') || undefined,
      
      
      
      address1: formData.get('address1') || undefined,
      
      
      
      address2: formData.get('address2') || undefined,
      
      
      
      address3: formData.get('address3') || undefined,
      
      
      
      remark: formData.get('remark') || undefined,
      
      
      
      
      cityId: formData.get('cityId') ? Number(formData.get('cityId')) : undefined,
      
      
    }

    const validatedData = partySchema.parse(rawData)

    // Add organization context if available
    const dataWithOrg = currentOrg 
      ? { ...validatedData, organizationId: currentOrg.id }
      : validatedData

    // Update the entity
    await springService.put(`/parties/${id}`, { id, ...dataWithOrg })

    // Revalidate pages
    revalidatePath('/parties')
    revalidatePath(`/parties/${id}`)
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        errors: error.flatten().fieldErrors
      }
    }
    
    console.error('Error updating Party:', error)
    return { error: 'Failed to update party. Please try again.' }
  }

  // Redirect to the details page on success
  redirect(`/parties/${id}`)
}

/**
 * Delete a Party
 */
export async function deleteParty(id: number): Promise<{ success?: boolean; error?: string }> {
  try {
    // Verify session and check permissions
    const session = await verifySession()
    
    if (!(await hasRole('party:delete'))) {
      return { error: 'Insufficient permissions to delete party' }
    }

    // Delete the entity
    await springService.delete(`/parties/${id}`)

    // Revalidate the list page
    revalidatePath('/parties')
    
    return { success: true }
  } catch (error) {
    console.error('Error deleting Party:', error)
    return { error: 'Failed to delete party. Please try again.' }
  }
}

/**
 * Get Parties for current organization
 */
export async function getPartiesForOrganization() {
  try {
    const session = await verifySession()
    const currentOrg = await getCurrentOrganization()
    
    if (!(await hasRole('party:read'))) {
      throw new Error('Insufficient permissions to read parties')
    }
    
    // Build query parameters with organization filter
    const params = currentOrg ? { organizationId: currentOrg.id } : {}
    
    const response = await springService.get('/parties', { params })
    return response
  } catch (error) {
    console.error('Error fetching Parties for organization:', error)
    throw error
  }
}
