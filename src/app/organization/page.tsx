'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserOrganizations } from '@/hooks/useUserOrganizations';
import { Coffee } from 'lucide-react';
import { persistentLog } from '@/lib/debug-logger';
import { useUserAuthorities } from '@/core/auth';

export default function OrganizationPage() {
  const { data: organizations, isLoading, isError } = useUserOrganizations();
  const router = useRouter();
  const { hasGroup } = useUserAuthorities();
  const isBusinessPartner = hasGroup('Business Partners');
  useEffect(() => {
    localStorage.removeItem('selectedOrganizationId');
    persistentLog('OrganizationPage: Cleared localStorage');
  }, []);

  useEffect(() => {
    // Handle error state
    if (isError) {
      persistentLog('OrganizationPage: Error loading organizations, redirecting to auth');
      router.replace('/auth/signin');
      return;
    }

    if (!isLoading && organizations !== undefined) {
      persistentLog('OrganizationPage: Routing decision', {
        organizationsCount: organizations.length,
        organizations: organizations.map((o) => ({ id: o.id, name: o.name })),
      });

      if (organizations.length === 0) {
        persistentLog('OrganizationPage: No orgs → /organization/organization-setup');
        router.replace('/organization/organization-setup');
      } else if (organizations.length === 1) {
        persistentLog('OrganizationPage: Single org → /dashboard', {
          orgId: organizations[0].id,
          orgName: organizations[0].name,
        });
        localStorage.setItem('selectedOrganizationId', organizations[0].id);
        localStorage.setItem('selectedOrganizationName', organizations[0].name);

        // Also set cookies for SSR access
        document.cookie = `selectedOrganizationId=${organizations[0].id}; path=/; max-age=31536000; SameSite=Lax`;
        document.cookie = `selectedOrganizationName=${encodeURIComponent(organizations[0].name)}; path=/; max-age=31536000; SameSite=Lax`;
        if (isBusinessPartner) {
          router.replace('/business-partner-dashboard');
        } else {
          router.replace('/dashboard');
        }
      } else {
        persistentLog('OrganizationPage: Multiple orgs → /organization/organization-select');
        router.replace('/organization/organization-select');
      }
    }
  }, [organizations, isLoading, isError, router]);

  persistentLog('OrganizationPage: Render', {
    isLoading,
    organizationsCount: organizations?.length,
  });

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center">
        <Coffee className="w-12 h-12 text-primary animate-bounce mb-4" />
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        <p className="mt-4 text-muted-foreground">Brewing your organization...</p>
      </div>
    </div>
  );
}
