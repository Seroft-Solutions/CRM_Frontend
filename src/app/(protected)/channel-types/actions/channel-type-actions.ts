'use server'

import { verifySession, hasRole, getCurrentOrganization } from '@/lib/dal'
import { springService } from '@/core/api/services/spring-service'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

// Define validation schema for ChannelType
const channeltypeSchema = z.object({
  
  
  name: z.string(),
  
  
  
  description: z.string().optional(),
  
  
  
  remark: z.any().optional(),
  
  
  
})

export type ChannelTypeFormData = z.infer<typeof channeltypeSchema>

/**
 * Create a new ChannelType
 */
export async function createChannelType(
  prevState: any,
  formData: FormData
): Promise<{ success?: boolean; error?: string; errors?: Record<string, string[]> }> {
  try {
    // Verify session and check permissions
    const session = await verifySession()
    const currentOrg = await getCurrentOrganization()
    
    if (!(await hasRole('channelType:create'))) {
      return { error: 'Insufficient permissions to create channel type' }
    }

    // Parse and validate form data
    const rawData = {
      
      
      name: formData.get('name') || undefined,
      
      
      
      description: formData.get('description') || undefined,
      
      
      
      remark: formData.get('remark') || undefined,
      
      
      
    }

    const validatedData = channeltypeSchema.parse(rawData)

    // Add organization context if available
    const dataWithOrg = currentOrg 
      ? { ...validatedData, organizationId: currentOrg.id }
      : validatedData

    // Create the entity
    await springService.post('/channel-types', dataWithOrg)

    // Revalidate the list page
    revalidatePath('/channel-types')
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        errors: error.flatten().fieldErrors
      }
    }
    
    console.error('Error creating ChannelType:', error)
    return { error: 'Failed to create channel type. Please try again.' }
  }

  // Redirect to the list page on success
  redirect('/channel-types')
}

/**
 * Update an existing ChannelType
 */
export async function updateChannelType(
  id: number,
  prevState: any,
  formData: FormData
): Promise<{ success?: boolean; error?: string; errors?: Record<string, string[]> }> {
  try {
    // Verify session and check permissions
    const session = await verifySession()
    const currentOrg = await getCurrentOrganization()
    
    if (!(await hasRole('channelType:update'))) {
      return { error: 'Insufficient permissions to update channel type' }
    }

    // Parse and validate form data
    const rawData = {
      
      
      name: formData.get('name') || undefined,
      
      
      
      description: formData.get('description') || undefined,
      
      
      
      remark: formData.get('remark') || undefined,
      
      
      
    }

    const validatedData = channeltypeSchema.parse(rawData)

    // Add organization context if available
    const dataWithOrg = currentOrg 
      ? { ...validatedData, organizationId: currentOrg.id }
      : validatedData

    // Update the entity
    await springService.put(`/channel-types/${id}`, { id, ...dataWithOrg })

    // Revalidate pages
    revalidatePath('/channel-types')
    revalidatePath(`/channel-types/${id}`)
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        errors: error.flatten().fieldErrors
      }
    }
    
    console.error('Error updating ChannelType:', error)
    return { error: 'Failed to update channel type. Please try again.' }
  }

  // Redirect to the details page on success
  redirect(`/channel-types/${id}`)
}

/**
 * Delete a ChannelType
 */
export async function deleteChannelType(id: number): Promise<{ success?: boolean; error?: string }> {
  try {
    // Verify session and check permissions
    const session = await verifySession()
    
    if (!(await hasRole('channelType:delete'))) {
      return { error: 'Insufficient permissions to delete channel type' }
    }

    // Delete the entity
    await springService.delete(`/channel-types/${id}`)

    // Revalidate the list page
    revalidatePath('/channel-types')
    
    return { success: true }
  } catch (error) {
    console.error('Error deleting ChannelType:', error)
    return { error: 'Failed to delete channel type. Please try again.' }
  }
}

/**
 * Get ChannelTypes for current organization
 */
export async function getChannelTypesForOrganization() {
  try {
    const session = await verifySession()
    const currentOrg = await getCurrentOrganization()
    
    if (!(await hasRole('channelType:read'))) {
      throw new Error('Insufficient permissions to read channel types')
    }
    
    // Build query parameters with organization filter
    const params = currentOrg ? { organizationId: currentOrg.id } : {}
    
    const response = await springService.get('/channel-types', { params })
    return response
  } catch (error) {
    console.error('Error fetching ChannelTypes for organization:', error)
    throw error
  }
}
