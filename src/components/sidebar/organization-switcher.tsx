"use client"

import * as React from "react"
import { ChevronsUpDown, Plus, Check, Building2 } from "lucide-react"
import { useUserOrganizations } from "@/hooks/useUserOrganizations"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

export function OrganizationSwitcher() {
  const { isMobile } = useSidebar()
  const { data: organizations, isLoading } = useUserOrganizations()
  
  const currentOrganization = organizations && organizations.length > 0 ? organizations[0] : null
  const [activeOrganization, setActiveOrganization] = React.useState(currentOrganization)

  React.useEffect(() => {
    if (currentOrganization && !activeOrganization) {
      setActiveOrganization(currentOrganization)
    }
  }, [currentOrganization, activeOrganization])

  const displayOrg = activeOrganization || currentOrganization

  if (isLoading || !organizations?.length || !displayOrg) {
    return null
  }

  const handleOrganizationSwitch = (org: typeof organizations[0]) => {
    setActiveOrganization(org)
    console.log('Switching to organization:', org)
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                <Building2 className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">CRM Cup</span>
                <span className="truncate text-xs">{displayOrg.name}</span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-muted-foreground text-xs">
              Organizations
            </DropdownMenuLabel>
            {organizations.map((org, index) => (
              <DropdownMenuItem
                key={org.id}
                onClick={() => handleOrganizationSwitch(org)}
                className="gap-2 p-2"
              >
                <div className="flex size-6 items-center justify-center rounded-md border">
                  <Building2 className="size-3.5 shrink-0" />
                </div>
                <div className="flex flex-col flex-1">
                  <span className="font-medium">{org.name}</span>
                </div>
                {displayOrg.id === org.id && (
                  <Check className="size-4" />
                )}
                <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 p-2">
              <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                <Plus className="size-4" />
              </div>
              <div className="text-muted-foreground font-medium">Add organization</div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
