'use client';

import * as React from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { CrmCupLogo } from '@/components/branding/crm-cup-logo';
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

export function OrganizationSwitcher() {
  const { isMobile } = useSidebar();
  const router = useRouter();
  const { data: organizations, isLoading } = useUserOrganizations();
  const { data: session } = useSession();

  const getSelectedOrganization = React.useCallback(() => {
    if (!organizations?.length) return null;

    const selectedOrgId = localStorage.getItem('selectedOrganizationId');
    const selectedOrgName = localStorage.getItem('selectedOrganizationName');

    let targetOrg = organizations[0];

    if (selectedOrgId) {
      const foundById = organizations.find((org) => org.id === selectedOrgId);
      if (foundById) {
        targetOrg = foundById;
      }
    }

    const needsIdUpdate = !selectedOrgId || selectedOrgId !== targetOrg.id;
    const needsNameUpdate = !selectedOrgName || selectedOrgName !== targetOrg.name;

    if (needsIdUpdate || needsNameUpdate) {
      console.log('Organization switcher: Syncing localStorage with current org data');

      if (needsIdUpdate) {
        localStorage.setItem('selectedOrganizationId', targetOrg.id);
        console.log('Updated selectedOrganizationId:', targetOrg.id);
      }

      if (needsNameUpdate) {
        localStorage.setItem('selectedOrganizationName', targetOrg.name);
        console.log('Updated selectedOrganizationName:', targetOrg.name);
      }

      document.cookie = `selectedOrganizationId=${targetOrg.id}; path=/; max-age=31536000; SameSite=Lax`;
      document.cookie = `selectedOrganizationName=${encodeURIComponent(targetOrg.name)}; path=/; max-age=31536000; SameSite=Lax`;
    }

    return targetOrg;
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

    localStorageCleanup.organizationSwitch();

    setActiveOrganization(org);
    localStorage.setItem('selectedOrganizationId', org.id);
    localStorage.setItem('selectedOrganizationName', org.name);

    document.cookie = `selectedOrganizationId=${org.id}; path=/; max-age=31536000; SameSite=Lax`;
    document.cookie = `selectedOrganizationName=${encodeURIComponent(org.name)}; path=/; max-age=31536000; SameSite=Lax`;

    window.location.reload();
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="!border !bg-sidebar !text-sidebar-foreground shadow-sm transition-shadow duration-200 h-auto py-3 hover:shadow-md data-[state=open]:!bg-sidebar-accent data-[state=open]:!text-sidebar-accent-foreground data-[state=open]:shadow-md"
              style={{
                borderColor: 'var(--sidebar-accent)',
              }}
            >
              <div
                className="flex h-10 w-10 min-w-10 items-center justify-center rounded-full border shadow-sm shrink-0 overflow-hidden"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--sidebar-accent) 18%, var(--sidebar))',
                  borderColor: 'var(--sidebar-border)',
                }}
              >
                <CrmCupLogo variant="mark" className="size-6" />
              </div>
              <div className="grid flex-1 text-left leading-tight gap-0.5 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-base tracking-tight text-sidebar-foreground">
                    CRM Cup
                  </span>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                </div>
                <span className="truncate text-sm font-semibold text-sidebar-foreground">
                  {displayOrg.name}
                </span>
                {session?.user?.email && (
                  <span className="truncate text-xs text-sidebar-foreground/70">
                    {session.user.email}
                  </span>
                )}
              </div>
              <ChevronsUpDown className="ml-auto text-sidebar-foreground/60 group-hover:text-sidebar-foreground transition-colors shrink-0" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-72 rounded-xl border border-sidebar-border/60 bg-sidebar text-sidebar-foreground shadow-xl p-3 space-y-2"
            align="start"
            side={isMobile ? 'bottom' : 'right'}
            sideOffset={8}
          >
            <DropdownMenuLabel className="text-xs font-semibold uppercase tracking-wider px-4 py-3 border-b border-sidebar-border/40 text-sidebar-foreground/80">
              Switch Organization
            </DropdownMenuLabel>
            <div className="space-y-2">
              {organizations.map((org, index) => (
                <DropdownMenuItem
                  key={org.id}
                  onClick={() => handleOrganizationSwitch(org)}
                  className="gap-3 p-3 rounded-xl border flex items-center cursor-pointer transition-all duration-150 hover:translate-x-0.5 focus:bg-sidebar focus:text-sidebar-foreground"
                  style={{
                    backgroundColor:
                      displayOrg.id === org.id
                        ? 'color-mix(in srgb, var(--sidebar-accent) 20%, var(--sidebar))'
                        : 'var(--sidebar)',
                    borderColor:
                      displayOrg.id === org.id ? 'var(--sidebar-accent)' : 'var(--sidebar-border)',
                    color: 'var(--sidebar-foreground)',
                  }}
                >
                  <div
                    className="flex h-8 w-8 min-w-8 items-center justify-center rounded-full border overflow-hidden"
                    style={{
                      backgroundColor:
                        displayOrg.id === org.id
                          ? 'color-mix(in srgb, var(--sidebar-accent) 35%, transparent)'
                          : 'color-mix(in srgb, var(--sidebar-foreground) 10%, transparent)',
                      borderColor:
                        displayOrg.id === org.id
                          ? 'var(--sidebar-accent)'
                          : 'var(--sidebar-border)',
                      color: 'var(--sidebar-foreground)',
                    }}
                  >
                    <CrmCupLogo variant="mark" className="size-5" />
                  </div>
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="font-semibold truncate">{org.name}</span>
                    <span className="text-xs text-sidebar-foreground/70">
                      Organization #{index + 1}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {displayOrg.id === org.id && (
                      <div className="flex items-center gap-1">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: '#22c55e' }}
                        ></div>
                        <span className="text-xs text-green-400 font-medium">Active</span>
                      </div>
                    )}
                    {displayOrg.id === org.id && <Check className="size-4 text-green-400" />}
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
