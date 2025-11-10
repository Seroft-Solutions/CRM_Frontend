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
  SidebarPinButton,
  SidebarRail,
} from '@/components/ui/sidebar';
import { sidebarItems } from '@/components/sidebar/sidebar-items';

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="border-b border-sidebar-border/60 bg-sidebar relative group-data-[collapsible=icon]:items-start group-data-[collapsible=icon]:pt-2">
        <OrganizationSwitcher />
        <SidebarPinButton className="absolute right-2 top-2 inline-flex rounded-full bg-sidebar/60 shadow-sm ring-1 ring-black/5 hover:bg-sidebar/80 group-data-[collapsible=icon]:static group-data-[collapsible=icon]:mt-2 group-data-[collapsible=icon]:ml-auto group-data-[collapsible=icon]:bg-transparent" />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={sidebarItems} />
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border/60 bg-sidebar">
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
