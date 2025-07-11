'use client';

import * as React from 'react';

import { NavMain } from '@/components/sidebar/nav-main';
import { NavUser } from '@/components/sidebar/nav-user';
import { OrganizationSwitcher } from '@/components/sidebar/organization-switcher';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar';
import { sidebarItems } from './sidebar-items';

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="border-b border-gray-200/40 bg-white/50 backdrop-blur-sm">
        <OrganizationSwitcher />
      </SidebarHeader>
      <SidebarContent className="bg-gradient-to-b from-transparent via-white/20 to-white/40">
        <NavMain items={sidebarItems} />
      </SidebarContent>
      <SidebarFooter className="border-t border-gray-200/40 bg-white/50 backdrop-blur-sm">
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
