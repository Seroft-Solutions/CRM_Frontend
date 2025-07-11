'use client';

import * as React from 'react';
import {InlinePermissionGuard, PermissionGuard, useAuth} from '@/core/auth';
import { useUserAuthorities } from '@/core/auth/hooks';
import { useUserOrganizations } from '@/hooks/useUserOrganizations';
import { Building2, Briefcase } from 'lucide-react';

export function TenantHeader() {
  const { session } = useAuth();
  const { hasGroup } = useUserAuthorities();
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
  // Don't render if user doesn't have Business Partners group
  if (!hasGroup('Business Partners')) {
    return null;
  }

  return (
        <div className="mx-auto mt-2 max-w-md w-full">
          <div className="flex items-center justify-between px-4 py-3 rounded-xl shadow-md bg-gradient-to-r from-blue-600 to-blue-700 border border-blue-800/50">
            {/* Left Icon */}
            <div className="flex items-center gap-3">
              <div className="bg-blue-500/80 p-2 rounded-lg">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-[0.65rem] text-blue-100 uppercase font-semibold tracking-wide">
                  Currently working with
                </p>
                <h2 className="text-base font-bold text-white truncate">{selectedOrganization}</h2>
              </div>
            </div>

            {/* Role Badge */}
            <div className="px-3 py-1 bg-white/10 border border-white/20 text-white text-xs font-semibold rounded-full flex items-center gap-1">
              <Briefcase className="w-3.5 h-3.5" />
              Partner
            </div>
          </div>
        </div>
  );
}
