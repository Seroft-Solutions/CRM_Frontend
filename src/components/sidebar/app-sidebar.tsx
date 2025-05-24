"use client"

import * as React from "react"
import { Building2 } from "lucide-react"

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
import type { Session } from "next-auth"; // Add this import

// Team data - this could also be fetched from the backend
const teams = [
  {
    name: "CRM Cup",
    logo: Building2,
    plan: "Enterprise",
  },
]

export function AppSidebar({ session, ...props }: React.ComponentProps<typeof Sidebar> & { session: Session | null }) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={sidebarItems} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser session={session} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}