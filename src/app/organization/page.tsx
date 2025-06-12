'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserOrganizations } from '@/hooks/useUserOrganizations';
import { Loader2 } from 'lucide-react';
import { persistentLog } from '@/lib/debug-logger';

export default function OrganizationPage() {
  const { data: organizations, isLoading } = useUserOrganizations();
  const router = useRouter();

  useEffect(() => {
    localStorage.removeItem('selectedOrganizationId');
    persistentLog('OrganizationPage: Cleared localStorage');
  }, []);

  useEffect(() => {
    if (!isLoading && organizations !== undefined) {
      persistentLog('OrganizationPage: Routing decision', {
        organizationsCount: organizations.length,
        organizations: organizations.map(o => ({ id: o.id, name: o.name }))
      });

      if (organizations.length === 0) {
        persistentLog('OrganizationPage: No orgs → /organization/organization-setup');
        router.replace('/organization/organization-setup');
      } else if (organizations.length === 1) {
        persistentLog('OrganizationPage: Single org → /dashboard', {
          orgId: organizations[0].id,
          orgName: organizations[0].name
        });
        localStorage.setItem('selectedOrganizationId', organizations[0].id);
        router.replace('/dashboard');
      } else {
        persistentLog('OrganizationPage: Multiple orgs → /organization/organization-select');
        router.replace('/organization/organization-select');
      }
    }
  }, [organizations, isLoading, router]);

  persistentLog('OrganizationPage: Render', { isLoading, organizationsCount: organizations?.length });

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin mx-auto" />
        <p>Checking organization status...</p>
      </div>
    </div>
  );
}
