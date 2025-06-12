import { useQuery } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { organizationApiService, type UserOrganization } from '@/services/organization/organization-api.service'

export function useUserOrganizations() {
  const { data: session } = useSession()
  const isAuthenticated = !!session?.user?.id

  return useQuery({
    queryKey: ['user-organizations'],
    queryFn: () => organizationApiService.getUserOrganizations(),
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,   // 10 minutes
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000)
  })
}

// Hook for getting current organization (first one by default)
export function useCurrentOrganization(): UserOrganization | null {
  const { data: organizations } = useUserOrganizations()
  return organizations?.[0] || null
}

// Hook for checking if user has specific organization
export function useHasOrganization(organizationId: string): boolean {
  const { data: organizations } = useUserOrganizations()
  return organizations?.some(org => org.id === organizationId) ?? false
}
