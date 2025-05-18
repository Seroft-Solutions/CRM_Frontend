"use client"

import { ChevronRight } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import { type SidebarItem } from "./sidebar-items"

export function NavMain({
  items,
}: {
  items: SidebarItem[]
}) {
  const pathname = usePathname();

  // Helper function to check if the current path matches or is a child of the given path
  const isActive = (item: SidebarItem): boolean => {
    if (item.path && pathname === item.path) {
      return true;
    }
    
    // Check if any child item is active
    if (item.children) {
      return item.children.some(child => 
        (child.path && pathname === child.path) || 
        (child.path && pathname.startsWith(child.path + '/'))
      );
    }
    
    return false;
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel>CRM Platform</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const active = isActive(item);
          
          return item.children ? (
            // Items with children - collapsible menu
            // Now all items are expanded by default (defaultOpen={true})
            <Collapsible
              key={item.key}
              asChild
              defaultOpen={true}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton tooltip={item.label} data-active={active}>
                    {item.icon && <item.icon />}
                    <span>{item.label}</span>
                    <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.children?.map((subItem) => (
                      <SidebarMenuSubItem key={subItem.key}>
                        <SidebarMenuSubButton 
                          asChild
                          data-active={subItem.path && pathname === subItem.path}
                        >
                          <Link href={subItem.path || '#'}>
                            <span>{subItem.label}</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          ) : (
            // Items without children - direct link
            <SidebarMenuItem key={item.key}>
              <SidebarMenuButton 
                asChild
                tooltip={item.label}
                data-active={active}
              >
                <Link href={item.path || '#'}>
                  {item.icon && <item.icon />}
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
