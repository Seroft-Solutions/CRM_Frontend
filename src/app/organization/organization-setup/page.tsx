'use client';

import { OrganizationSetupWizard } from '@/components/organization-setup/OrganizationSetupWizard';
import { useUserOrganizations } from '@/hooks/useUserOrganizations';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function OrganizationSetupPage() {
  const { data: organizations, isLoading } = useUserOrganizations();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && organizations !== undefined && organizations.length > 0) {
      // User has organizations - redirect to main router
      router.replace('/organization');
    }
  }, [organizations, isLoading, router]);

  return <OrganizationSetupWizard />;
}
