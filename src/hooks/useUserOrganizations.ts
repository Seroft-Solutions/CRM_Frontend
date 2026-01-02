import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import {
  organizationApiService,
  type UserOrganization,
} from '@/services/organization/organization-api.service';

export function useUserOrganizations() {
  const { data: session, status } = useSession();
  const isAuthenticated = !!session?.user?.id;
  const isLoading = status === 'loading';

  // Check if logout is in progress
  const isLoggingOut = typeof window !== 'undefined'
    ? sessionStorage.getItem('LOGOUT_IN_PROGRESS') === 'true'
    : false;

  return useQuery({
    queryKey: ['user-organizations'],
    queryFn: () => organizationApiService.getUserOrganizations(),
    // CRITICAL: Disable during logout to prevent 403 errors
    enabled: isAuthenticated && !isLoading && !isLoggingOut && !session?.error,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

export function useOrganizationDetails(organizationId: string) {
  const { data: session, status } = useSession();
  const isAuthenticated = !!session?.user?.id;
  const isLoading = status === 'loading';

  return useQuery({
    queryKey: ['organization-details', organizationId],
    queryFn: () => organizationApiService.getOrganizationDetails(organizationId),
    enabled: isAuthenticated && !isLoading && !!organizationId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

export function useCurrentOrganization(): UserOrganization | null {
  const { data: organizations, isError } = useUserOrganizations();
  if (isError) return null;
  return organizations?.[0] || null;
}

export function useHasOrganization(organizationId: string): boolean {
  const { data: organizations, isError } = useUserOrganizations();
  if (isError || !organizationId) return false;
  return organizations?.some((org) => org.id === organizationId) ?? false;
}
