"use client"

import { ChevronRight } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { usePermission } from "@/components/auth/permission-guard"

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
        {items.map((item) => (
          <NavItem key={item.key} item={item} pathname={pathname} isActive={isActive} />
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}

// Separate component to handle individual navigation items with permission checking
function NavItem({ 
  item, 
  pathname, 
  isActive 
}: { 
  item: SidebarItem; 
  pathname: string; 
  isActive: (item: SidebarItem) => boolean;
}) {
  const hasPermission = usePermission(item.requiredPermission || '');
  
  // If permission is required and user doesn't have it, don't render
  if (item.requiredPermission && !hasPermission) {
    return null;
  }

  const active = isActive(item);
  
  // Filter children based on permissions
  const visibleChildren = item.children?.filter(child => {
    const childHasPermission = usePermission(child.requiredPermission || '');
    return !child.requiredPermission || childHasPermission;
  });

  return item.children ? (
    // Items with children - collapsible menu
    // Only render if there are visible children or no permission requirement
    visibleChildren && visibleChildren.length > 0 ? (
      <Collapsible
        key={item.key}
        asChild
        defaultOpen={item.expandable ?? true}
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
              {visibleChildren.map((subItem) => (
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
    ) : null
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
}
