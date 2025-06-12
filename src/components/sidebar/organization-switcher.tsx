"use client"

import * as React from "react"
import { ChevronsUpDown, Plus, Check, Building2 } from "lucide-react"
import { useRouter } from "next/navigation"
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
  const router = useRouter()
  const { data: organizations, isLoading } = useUserOrganizations()
  
  // Get the selected organization from localStorage
  const getSelectedOrganization = React.useCallback(() => {
    if (!organizations?.length) return null
    
    const selectedOrgId = localStorage.getItem('selectedOrganizationId')
    if (selectedOrgId) {
      const selectedOrg = organizations.find(org => org.id === selectedOrgId)
      if (selectedOrg) return selectedOrg
    }
    
    // Fallback to first organization if no selection found
    return organizations[0]
  }, [organizations])

  const [activeOrganization, setActiveOrganization] = React.useState(getSelectedOrganization)

  React.useEffect(() => {
    const selectedOrg = getSelectedOrganization()
    if (selectedOrg) {
      setActiveOrganization(selectedOrg)
    }
  }, [getSelectedOrganization])

  const displayOrg = activeOrganization

  if (isLoading || !organizations?.length || !displayOrg) {
    return null
  }

  const handleOrganizationSwitch = (org: typeof organizations[0]) => {
    setActiveOrganization(org)
    localStorage.setItem('selectedOrganizationId', org.id)
    localStorage.setItem('selectedOrganizationName', org.name)
    console.log('Switching to organization:', org)
    window.location.reload()
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
