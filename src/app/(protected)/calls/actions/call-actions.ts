'use server'

import { verifySession, hasRole, getCurrentOrganization } from '@/lib/dal'
import { springService } from '@/core/api/services/spring-service'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

// Define validation schema for Call
const callSchema = z.object({
  
  
  callDateTime: z.string().datetime(),
  
  
  
  direction: z.any(),
  
  
  
  durationSeconds: z.number().min(0).optional(),
  
  
  
  outcome: z.any().optional(),
  
  
  
  expectedRevenue: z.any().optional(),
  
  
  
  actualRevenue: z.any().optional(),
  
  
  
  probability: z.number().min(0).max(100).optional(),
  
  
  
  nextFollowUpDate: z.string().datetime().optional(),
  
  
  
  isCompleted: z.boolean(),
  
  
  
  summary: z.string().max(500).optional(),
  
  
  
  recordingUrl: z.string().max(500).optional(),
  
  
  
  internalNotes: z.string().max(2000).optional(),
  
  
  
  status: z.any(),
  
  
  
  isActive: z.boolean(),
  
  
  
  createdDate: z.string().datetime(),
  
  
  
  lastModifiedDate: z.string().datetime().optional(),
  
  
  
  
  assignedToId: z.number().optional(),
  
  
  
  channelPartyId: z.number().optional(),
  
  
  
  createdById: z.number().optional(),
  
  
  
  priorityId: z.number().optional(),
  
  
  
  callTypeId: z.number().optional(),
  
  
  
  subCallTypeId: z.number().optional(),
  
  
  
  sourceId: z.number().optional(),
  
  
  
  areaId: z.number().optional(),
  
  
  
  productId: z.number().optional(),
  
  
  
  channelTypeId: z.number().optional(),
  
  
  
  callCategoryId: z.number().optional(),
  
  
  
  callStatusId: z.number().optional(),
  
  
  
  
  
  partyId: z.number().optional(),
  
  
})

export type CallFormData = z.infer<typeof callSchema>

/**
 * Create a new Call
 */
export async function createCall(
  prevState: any,
  formData: FormData
): Promise<{ success?: boolean; error?: string; errors?: Record<string, string[]> }> {
  try {
    // Verify session and check permissions
    const session = await verifySession()
    const currentOrg = await getCurrentOrganization()
    
    if (!(await hasRole('call:create'))) {
      return { error: 'Insufficient permissions to create call' }
    }

    // Parse and validate form data
    const rawData = {
      
      
      callDateTime: formData.get('callDateTime') || undefined,
      
      
      
      direction: formData.get('direction') || undefined,
      
      
      
      durationSeconds: formData.get('durationSeconds') ? Number(formData.get('durationSeconds')) : undefined,
      
      
      
      outcome: formData.get('outcome') || undefined,
      
      
      
      expectedRevenue: formData.get('expectedRevenue') || undefined,
      
      
      
      actualRevenue: formData.get('actualRevenue') || undefined,
      
      
      
      probability: formData.get('probability') ? Number(formData.get('probability')) : undefined,
      
      
      
      nextFollowUpDate: formData.get('nextFollowUpDate') || undefined,
      
      
      
      isCompleted: formData.get('isCompleted') === 'true',
      
      
      
      summary: formData.get('summary') || undefined,
      
      
      
      recordingUrl: formData.get('recordingUrl') || undefined,
      
      
      
      internalNotes: formData.get('internalNotes') || undefined,
      
      
      
      status: formData.get('status') || undefined,
      
      
      
      isActive: formData.get('isActive') === 'true',
      
      
      
      createdDate: formData.get('createdDate') || undefined,
      
      
      
      lastModifiedDate: formData.get('lastModifiedDate') || undefined,
      
      
      
      
      assignedToId: formData.get('assignedToId') ? Number(formData.get('assignedToId')) : undefined,
      
      
      
      channelPartyId: formData.get('channelPartyId') ? Number(formData.get('channelPartyId')) : undefined,
      
      
      
      createdById: formData.get('createdById') ? Number(formData.get('createdById')) : undefined,
      
      
      
      priorityId: formData.get('priorityId') ? Number(formData.get('priorityId')) : undefined,
      
      
      
      callTypeId: formData.get('callTypeId') ? Number(formData.get('callTypeId')) : undefined,
      
      
      
      subCallTypeId: formData.get('subCallTypeId') ? Number(formData.get('subCallTypeId')) : undefined,
      
      
      
      sourceId: formData.get('sourceId') ? Number(formData.get('sourceId')) : undefined,
      
      
      
      areaId: formData.get('areaId') ? Number(formData.get('areaId')) : undefined,
      
      
      
      productId: formData.get('productId') ? Number(formData.get('productId')) : undefined,
      
      
      
      channelTypeId: formData.get('channelTypeId') ? Number(formData.get('channelTypeId')) : undefined,
      
      
      
      callCategoryId: formData.get('callCategoryId') ? Number(formData.get('callCategoryId')) : undefined,
      
      
      
      callStatusId: formData.get('callStatusId') ? Number(formData.get('callStatusId')) : undefined,
      
      
      
      
      
      partyId: formData.get('partyId') ? Number(formData.get('partyId')) : undefined,
      
      
    }

    const validatedData = callSchema.parse(rawData)

    // Add organization context if available
    const dataWithOrg = currentOrg 
      ? { ...validatedData, organizationId: currentOrg.id }
      : validatedData

    // Create the entity
    await springService.post('/calls', dataWithOrg)

    // Revalidate the list page
    revalidatePath('/calls')
    
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
    
    console.error('Error creating Call:', error)
    return { error: 'Failed to create call. Please try again.' }
  }

  // Redirect to the list page on success
  redirect('/calls')
}

/**
 * Update an existing Call
 */
export async function updateCall(
  id: number,
  prevState: any,
  formData: FormData
): Promise<{ success?: boolean; error?: string; errors?: Record<string, string[]> }> {
  try {
    // Verify session and check permissions
    const session = await verifySession()
    const currentOrg = await getCurrentOrganization()
    
    if (!(await hasRole('call:update'))) {
      return { error: 'Insufficient permissions to update call' }
    }

    // Parse and validate form data
    const rawData = {
      
      
      callDateTime: formData.get('callDateTime') || undefined,
      
      
      
      direction: formData.get('direction') || undefined,
      
      
      
      durationSeconds: formData.get('durationSeconds') ? Number(formData.get('durationSeconds')) : undefined,
      
      
      
      outcome: formData.get('outcome') || undefined,
      
      
      
      expectedRevenue: formData.get('expectedRevenue') || undefined,
      
      
      
      actualRevenue: formData.get('actualRevenue') || undefined,
      
      
      
      probability: formData.get('probability') ? Number(formData.get('probability')) : undefined,
      
      
      
      nextFollowUpDate: formData.get('nextFollowUpDate') || undefined,
      
      
      
      isCompleted: formData.get('isCompleted') === 'true',
      
      
      
      summary: formData.get('summary') || undefined,
      
      
      
      recordingUrl: formData.get('recordingUrl') || undefined,
      
      
      
      internalNotes: formData.get('internalNotes') || undefined,
      
      
      
      status: formData.get('status') || undefined,
      
      
      
      isActive: formData.get('isActive') === 'true',
      
      
      
      createdDate: formData.get('createdDate') || undefined,
      
      
      
      lastModifiedDate: formData.get('lastModifiedDate') || undefined,
      
      
      
      
      assignedToId: formData.get('assignedToId') ? Number(formData.get('assignedToId')) : undefined,
      
      
      
      channelPartyId: formData.get('channelPartyId') ? Number(formData.get('channelPartyId')) : undefined,
      
      
      
      createdById: formData.get('createdById') ? Number(formData.get('createdById')) : undefined,
      
      
      
      priorityId: formData.get('priorityId') ? Number(formData.get('priorityId')) : undefined,
      
      
      
      callTypeId: formData.get('callTypeId') ? Number(formData.get('callTypeId')) : undefined,
      
      
      
      subCallTypeId: formData.get('subCallTypeId') ? Number(formData.get('subCallTypeId')) : undefined,
      
      
      
      sourceId: formData.get('sourceId') ? Number(formData.get('sourceId')) : undefined,
      
      
      
      areaId: formData.get('areaId') ? Number(formData.get('areaId')) : undefined,
      
      
      
      productId: formData.get('productId') ? Number(formData.get('productId')) : undefined,
      
      
      
      channelTypeId: formData.get('channelTypeId') ? Number(formData.get('channelTypeId')) : undefined,
      
      
      
      callCategoryId: formData.get('callCategoryId') ? Number(formData.get('callCategoryId')) : undefined,
      
      
      
      callStatusId: formData.get('callStatusId') ? Number(formData.get('callStatusId')) : undefined,
      
      
      
      
      
      partyId: formData.get('partyId') ? Number(formData.get('partyId')) : undefined,
      
      
    }

    const validatedData = callSchema.parse(rawData)

    // Add organization context if available
    const dataWithOrg = currentOrg 
      ? { ...validatedData, organizationId: currentOrg.id }
      : validatedData

    // Update the entity
    await springService.put(`/calls/${id}`, { id, ...dataWithOrg })

    // Revalidate pages
    revalidatePath('/calls')
    revalidatePath(`/calls/${id}`)
    
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
    
    console.error('Error updating Call:', error)
    return { error: 'Failed to update call. Please try again.' }
  }

  // Redirect to the details page on success
  redirect(`/calls/${id}`)
}

/**
 * Delete a Call
 */
export async function deleteCall(id: number): Promise<{ success?: boolean; error?: string }> {
  try {
    // Verify session and check permissions
    const session = await verifySession()
    
    if (!(await hasRole('call:delete'))) {
      return { error: 'Insufficient permissions to delete call' }
    }

    // Delete the entity
    await springService.delete(`/calls/${id}`)

    // Revalidate the list page
    revalidatePath('/calls')
    
    return { success: true }
  } catch (error) {
    console.error('Error deleting Call:', error)
    return { error: 'Failed to delete call. Please try again.' }
  }
}

/**
 * Get Calls for current organization
 */
export async function getCallsForOrganization() {
  try {
    const session = await verifySession()
    const currentOrg = await getCurrentOrganization()
    
    if (!(await hasRole('call:read'))) {
      throw new Error('Insufficient permissions to read calls')
    }
    
    // Build query parameters with organization filter
    const params = currentOrg ? { organizationId: currentOrg.id } : {}
    
    const response = await springService.get('/calls', { params })
    return response
  } catch (error) {
    console.error('Error fetching Calls for organization:', error)
    throw error
  }
}
