'use client';

import { useState } from 'react';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarSeparator,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuAction,
  SidebarMenuBadge,
  useSidebar, SidebarGroupAction,
} from '@/components/ui/sidebar';
import { useSession } from 'next-auth/react';
import { useGetAccount } from '@/core/api/generated/endpoints/account-resource/account-resource.gen';
import { 
  AreaChart, 
  BellRing, 
  Building, 
  Calendar, 
  Coffee, 
  FileText, 
  Home, 
  MessageSquare, 
  Package, 
  Phone, 
  Plus,
  Settings, 
  ShoppingCart, 
  Users
} from 'lucide-react';
import { useCountCalls } from '@/core/api/generated/endpoints/call-resource/call-resource.gen';
import { useCountParties } from '@/core/api/generated/endpoints/party-resource/party-resource.gen';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export function CRMSidebar() {
  const { data: session } = useSession();
  const { data: account } = useGetAccount();
  const { data: callsCount } = useCountCalls();
  const { data: partiesCount } = useCountParties();
  const router = useRouter();
  const { state } = useSidebar();

  const menuItems = [
    { icon: Home, label: "Dashboard", path: "/dashboard" },
    { icon: Phone, label: "Calls", path: "/dashboard/calls", badge: callsCount },
    { icon: Users, label: "Parties", path: "/dashboard/parties", badge: partiesCount },
    { icon: Building, label: "Organizations", path: "/dashboard/organizations" },
    { icon: ShoppingCart, label: "Products", path: "/dashboard/products" },
    { icon: Calendar, label: "Calendar", path: "/dashboard/calendar" },
    { icon: MessageSquare, label: "Messages", path: "/dashboard/messages" },
    { icon: AreaChart, label: "Reports", path: "/dashboard/reports" },
    { icon: FileText, label: "Documents", path: "/dashboard/documents" },
    { icon: Settings, label: "Settings", path: "/dashboard/settings" },
  ];

  return (
    <Sidebar>
      <SidebarHeader className="flex flex-col items-start gap-2 px-4 pt-4">
        <div className="flex items-center gap-2">
          <Coffee className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold">CRM Cup</span>
        </div>
      </SidebarHeader>
      <SidebarSeparator />
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="px-4">Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton
                    asChild
                    isActive={router.asPath === item.path}
                    tooltip={state === "collapsed" ? item.label : undefined}
                  >
                    <a 
                      href={item.path}
                      onClick={(e) => {
                        e.preventDefault();
                        router.push(item.path);
                      }}
                    >
                      <item.icon />
                      <span>{item.label}</span>
                    </a>
                  </SidebarMenuButton>
                  {item.badge !== undefined && (
                    <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        <SidebarGroup>
          <SidebarGroupLabel className="px-4">Projects</SidebarGroupLabel>
          <SidebarGroupAction>
            <Plus className="h-4 w-4" />
          </SidebarGroupAction>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <span className="h-2 w-2 rounded-full bg-red-500" />
                  <span>Project Alpha</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <span className="h-2 w-2 rounded-full bg-blue-500" />
                  <span>Project Beta</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <span className="h-2 w-2 rounded-full bg-green-500" />
                  <span>Project Gamma</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarSeparator />
      <SidebarFooter className="p-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
            {account?.firstName?.charAt(0) || 'U'}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium">
              {account?.firstName} {account?.lastName}
            </span>
            <span className="text-xs text-muted-foreground">
              {account?.email}
            </span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
