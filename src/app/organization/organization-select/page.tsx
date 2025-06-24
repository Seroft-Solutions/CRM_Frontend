'use client';

import { OrganizationSelector } from '@/components/organization-setup/OrganizationSelector';
import { useUserOrganizations } from '@/hooks/useUserOrganizations';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { persistentLog } from '@/lib/debug-logger';

export default function OrganizationSelectPage() {
  const { data: organizations, isLoading } = useUserOrganizations();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && organizations !== undefined) {
      if (organizations.length <= 1) {
        persistentLog('OrganizationSelectPage: Wrong scenario, redirecting to /organization');
        router.replace('/organization');
      }
    }
  }, [organizations, isLoading, router]);

  persistentLog('OrganizationSelectPage: Render', {
    isLoading,
    organizationsCount: organizations?.length,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto" />
          <p>Loading organizations...</p>
        </div>
      </div>
    );
  }

  if (!organizations || organizations.length <= 1) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Redirecting...</p>
      </div>
    );
  }

  return <OrganizationSelector organizations={organizations} />;
}
