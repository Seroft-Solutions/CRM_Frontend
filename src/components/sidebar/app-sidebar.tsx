"use client"

import * as React from "react"
import { GalleryVerticalEnd, Building2 } from "lucide-react"

import { NavMain } from "@/components/sidebar/nav-main"
import { NavUser } from "@/components/sidebar/nav-user"
import { TeamSwitcher } from "@/components/sidebar/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { sidebarItems } from "./sidebar-items"

// This is sample data, you should replace it with real user data from authentication
const userData = {
  user: {
    name: "User Name",
    email: "user@example.com",
    avatar: "/avatars/user.jpg",
  },
  teams: [
    {
      name: "CRM Cup",
      logo: Building2,
      plan: "Enterprise",
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={userData.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={sidebarItems} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
