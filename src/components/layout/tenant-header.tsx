'use client';

import * as React from 'react';
import { useUserOrganizations } from '@/hooks/useUserOrganizations';
import { Building2, Briefcase } from 'lucide-react';
import {useAuth} from "@/core/auth/providers";

export function TenantHeader() {
  const { session } = useAuth();
  const { data: organizations } = useUserOrganizations();

  // State for selected organization
  const [selectedOrganization, setSelectedOrganization] = React.useState<string>('');

  // Get selected organization from localStorage
  const getSelectedOrganization = React.useCallback(() => {
    if (!organizations?.length) return '';

    const selectedOrgId = localStorage.getItem('selectedOrganizationId');
    const selectedOrgName = localStorage.getItem('selectedOrganizationName');

    if (selectedOrgName) {
      return selectedOrgName;
    }

    if (selectedOrgId) {
      const selectedOrg = organizations.find((org) => org.id === selectedOrgId);
      if (selectedOrg) return selectedOrg.name;
    }

    // Fallback to first organization
    return organizations[0]?.name || '';
  }, [organizations]);

  // Update organization when organizations data changes
  React.useEffect(() => {
    const orgName = getSelectedOrganization();
    setSelectedOrganization(orgName);
  }, [getSelectedOrganization]);

  // Listen for localStorage changes (when organization is switched)
  React.useEffect(() => {
    const handleStorageChange = () => {
      const orgName = getSelectedOrganization();
      setSelectedOrganization(orgName);
    };

    window.addEventListener('storage', handleStorageChange);

    // Also listen for manual localStorage updates within the same tab
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = function (key, value) {
      originalSetItem.apply(this, [key, value]);
      if (key === 'selectedOrganizationId' || key === 'selectedOrganizationName') {
        handleStorageChange();
      }
    };

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      localStorage.setItem = originalSetItem;
    };
  }, [getSelectedOrganization]);

  // Check if user belongs to Business Partners group
  const isBusinessPartner =
    session?.user?.roles?.includes('/Business Partners') ||
    session?.user?.groups?.includes('/Business Partners');

  // Only show for business partners with selected organization
  if (!isBusinessPartner || !selectedOrganization) {
    return null;
  }

  return (
    <div className="bg-blue-600 text-white rounded-lg shadow-md px-4 py-2 max-w-sm">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
          <Building2 className="h-4 w-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs text-blue-200 font-medium">Currently working with</div>
          <div className="text-sm font-bold text-white truncate">{selectedOrganization}</div>
        </div>
        <div className="flex items-center gap-1 px-2 py-1 bg-blue-500 rounded-full">
          <Briefcase className="h-3 w-3 text-white" />
          <span className="text-xs font-semibold text-white">Partner</span>
        </div>
      </div>
    </div>
  );
}
