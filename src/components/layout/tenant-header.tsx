'use client';

import * as React from 'react';
import { useAuth } from '@/core/auth';
import { useUserAuthorities } from '@/core/auth/hooks';
import { useUserOrganizations } from '@/hooks/useUserOrganizations';
import { Briefcase } from 'lucide-react';

const CupIcon = ({ className = 'size-4' }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {/* Coffee/Tea Cup */}
    <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
    <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
    {/* Handle */}
    <path d="M17 8v4" />
    {/* Steam lines */}
    <path d="M7 4v1" />
    <path d="M10 4v2" />
    <path d="M13 4v1" />
  </svg>
);

export function TenantHeader() {
  const { session } = useAuth();
  const { hasGroup } = useUserAuthorities();
  const { data: organizations } = useUserOrganizations();

  const [selectedOrganization, setSelectedOrganization] = React.useState<string>('');

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

    return organizations[0]?.name || '';
  }, [organizations]);

  React.useEffect(() => {
    const orgName = getSelectedOrganization();
    setSelectedOrganization(orgName);
  }, [getSelectedOrganization]);

  React.useEffect(() => {
    const handleStorageChange = () => {
      const orgName = getSelectedOrganization();
      setSelectedOrganization(orgName);
    };

    window.addEventListener('storage', handleStorageChange);

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

  if (!hasGroup('Business Partners')) {
    return null;
  }

  return (
    <div className="mx-auto mt-6 mb-6 max-w-6xl w-full px-4">
      <div className="bg-gradient-to-r from-slate-50 to-blue-50/30 border border-gray-200/60 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200">
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          {/* Left Section - Organization Info */}
          <div className="flex items-center gap-5">
            {/* Enhanced Icon */}
            <div className="relative">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-xl shadow-sm">
                <CupIcon className="w-5 h-5 text-white" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full shadow-sm"></div>
            </div>

            {/* Organization Details */}
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-100 px-2 py-1 rounded-full">
                  Active Organization
                </span>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-green-600 font-medium">Live</span>
                </div>
              </div>
              <h2 className="text-xl font-bold text-gray-900 tracking-tight">
                {selectedOrganization}
              </h2>
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-6">
            {/* Instructions - Desktop */}
            <div className="hidden lg:flex items-center gap-3 bg-white/70 backdrop-blur-sm border border-gray-200/80 rounded-lg px-4 py-3 shadow-sm">
              <div className="bg-amber-100 p-2 rounded-lg">
                <svg
                  className="w-4 h-4 text-amber-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="text-sm">
                <div className="text-gray-700 font-medium">Switch organizations?</div>
                <div className="text-gray-500 text-xs">
                  Use <span className="font-semibold text-blue-600">Organization Switcher</span> in
                  sidebar
                </div>
              </div>
            </div>

            {/* Enhanced Partner Badge */}
            <div className="relative group">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-5 py-3 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-1.5 rounded-lg">
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-blue-100">Business</div>
                    <div className="text-sm font-bold tracking-wide">PARTNER</div>
                  </div>
                </div>
              </div>
              {/* Subtle glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-200 -z-10"></div>
            </div>
          </div>
        </div>

        {/* Mobile Instructions */}
        <div className="lg:hidden px-6 pb-4">
          <div className="bg-white/60 backdrop-blur-sm border border-gray-200/80 rounded-lg p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="bg-amber-100 p-2 rounded-lg flex-shrink-0">
                <svg
                  className="w-4 h-4 text-amber-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="text-sm">
                <div className="text-gray-700 font-medium mb-1">Switch organizations?</div>
                <div className="text-gray-600">
                  Use the <span className="font-semibold text-blue-600">Organization Switcher</span>{' '}
                  in the sidebar to select a different organization
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
