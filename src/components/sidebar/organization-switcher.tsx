'use client';

import * as React from 'react';
import { ChevronsUpDown, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useUserOrganizations } from '@/hooks/useUserOrganizations';
import { localStorageCleanup } from '@/core/auth';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';

// Custom Coffee/Tea Cup Icon Component
const CupIcon = ({ className = "size-4" }: { className?: string }) => (
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

export function OrganizationSwitcher() {
  const { isMobile } = useSidebar();
  const router = useRouter();
  const { data: organizations, isLoading } = useUserOrganizations();

  // Get the selected organization from localStorage
  const getSelectedOrganization = React.useCallback(() => {
    if (!organizations?.length) return null;

    const selectedOrgId = localStorage.getItem('selectedOrganizationId');
    if (selectedOrgId) {
      const selectedOrg = organizations.find((org) => org.id === selectedOrgId);
      if (selectedOrg) return selectedOrg;
    }

    // Fallback to first organization if no selection found
    return organizations[0];
  }, [organizations]);

  const [activeOrganization, setActiveOrganization] = React.useState(getSelectedOrganization);

  React.useEffect(() => {
    const selectedOrg = getSelectedOrganization();
    if (selectedOrg) {
      setActiveOrganization(selectedOrg);
    }
  }, [getSelectedOrganization]);

  const displayOrg = activeOrganization;

  if (isLoading || !organizations?.length || !displayOrg) {
    return null;
  }

  const handleOrganizationSwitch = (org: (typeof organizations)[0]) => {
    console.log('Switching to organization:', org);
    
    // Clean up organization-related data and form drafts before switching
    localStorageCleanup.organizationSwitch();
    
    // Set new organization data in localStorage
    setActiveOrganization(org);
    localStorage.setItem('selectedOrganizationId', org.id);
    localStorage.setItem('selectedOrganizationName', org.name);
    
    // Also set cookies for SSR access
    document.cookie = `selectedOrganizationId=${org.id}; path=/; max-age=31536000; SameSite=Lax`;
    document.cookie = `selectedOrganizationName=${encodeURIComponent(org.name)}; path=/; max-age=31536000; SameSite=Lax`;
    
    // Reload to apply the new organization context
    window.location.reload();
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-gradient-to-r data-[state=open]:from-blue-50 data-[state=open]:to-indigo-50 data-[state=open]:text-blue-900 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/50 transition-all duration-200 border border-transparent data-[state=open]:border-blue-200 hover:border-blue-100"
            >
              <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white flex aspect-square size-10 items-center justify-center rounded-xl shadow-md hover:shadow-lg transition-all duration-200 hover:from-blue-700 hover:to-blue-800">
                <CupIcon className="size-5" />
              </div>
              <div className="grid flex-1 text-left leading-tight">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-base tracking-tight">CRM Cup</span>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                </div>
                <span className="truncate text-sm text-gray-600 font-medium">{displayOrg.name}</span>
              </div>
              <ChevronsUpDown className="ml-auto text-gray-400 group-hover:text-gray-600 transition-colors" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-72 rounded-xl shadow-lg border-gray-200/60 bg-white/95 backdrop-blur-sm"
            align="start"
            side={isMobile ? 'bottom' : 'right'}
            sideOffset={8}
          >
            <DropdownMenuLabel className="text-gray-500 text-xs font-semibold uppercase tracking-wider px-4 py-3 bg-gray-50/80 rounded-t-xl">
              Switch Organization
            </DropdownMenuLabel>
            <div className="p-2 space-y-1">
              {organizations.map((org, index) => (
                <DropdownMenuItem
                  key={org.id}
                  onClick={() => handleOrganizationSwitch(org)}
                  className="gap-3 p-3 rounded-lg hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:border-blue-200 transition-all duration-200 cursor-pointer border border-transparent"
                >
                  <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-100 to-blue-200 border border-blue-200/60">
                    <CupIcon className="size-4 text-blue-700" />
                  </div>
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="font-semibold text-gray-900 truncate">{org.name}</span>
                    <span className="text-xs text-gray-500">Organization #{index + 1}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {displayOrg.id === org.id && (
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-xs text-green-600 font-medium">Active</span>
                      </div>
                    )}
                    {displayOrg.id === org.id && <Check className="size-4 text-green-600" />}
                  </div>
                </DropdownMenuItem>
              ))}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
