'use client';

import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUserRoles } from '@/core/auth/hooks/use-user-roles';
import { normalizeRole } from '@/core/auth/utils';
import { cn } from '@/lib/utils';

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { type SidebarItem } from '@/components/sidebar/sidebar-items';

export function NavMain({ items }: { items: SidebarItem[] }) {
  const pathname = usePathname();
  const { roles: userRoles, isLoading: rolesLoading } = useUserRoles();

  const isActive = (item: SidebarItem): boolean => {
    if (item.path && pathname === item.path) {
      return true;
    }

    if (item.children) {
      return item.children.some(
        (child) =>
          (child.path && pathname === child.path) ||
          (child.path && pathname.startsWith(child.path + '/'))
      );
    }

    return false;
  };

  const hasPermission = (requiredPermission?: string): boolean => {
    if (!requiredPermission) return true;
    if (rolesLoading) return false;
    const normalizedPermission = normalizeRole(requiredPermission);
    return userRoles.includes(normalizedPermission);
  };

  return (
    <SidebarGroup>
      <SidebarGroupLabel>CRM Platform</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          <NavItem
            key={item.key}
            item={item}
            pathname={pathname}
            isActive={isActive}
            hasPermission={hasPermission}
          />
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}

function NavItem({
  item,
  pathname,
  isActive,
  hasPermission,
}: {
  item: SidebarItem;
  pathname: string;
  isActive: (item: SidebarItem) => boolean;
  hasPermission: (requiredPermission?: string) => boolean;
}) {
  const { state, setOpen } = useSidebar();

  const itemHasPermission = hasPermission(item.requiredPermission);

  if (item.requiredPermission && !itemHasPermission) {
    return null;
  }

  const active = isActive(item);

  const visibleChildren = item.children?.filter((child) => {
    const childHasPermission = hasPermission(child.requiredPermission);
    return !child.requiredPermission || childHasPermission;
  });

  const handleClick = () => {
    if (state === 'collapsed') {
      setOpen(true);
    }
  };

  const handleNavigation = () => {
    if (state === 'expanded') {
      setOpen(false);
    }
  };

  return item.children ? (
    visibleChildren && visibleChildren.length > 0 ? (
      <Collapsible
        key={item.key}
        asChild
        defaultOpen={item.expandable ?? true}
        className="group/collapsible"
      >
        <SidebarMenuItem>
          <CollapsibleTrigger asChild>
            <SidebarMenuButton
              tooltip={item.label}
              isActive={active}
              onClick={handleClick}
              className={cn(
                '!border !border-sidebar-border/40 !bg-sidebar !text-sidebar-foreground hover:!bg-sidebar hover:!text-sidebar-foreground',
                active && '!bg-sidebar-accent !text-sidebar-accent-foreground'
              )}
            >
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
                    isActive={Boolean(subItem.path && pathname === subItem.path)}
                    onClick={handleNavigation}
                    className="!bg-sidebar !text-sidebar-foreground hover:!bg-sidebar data-[active=true]:!bg-sidebar-accent data-[active=true]:!text-sidebar-accent-foreground"
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
    <SidebarMenuItem key={item.key}>
      <SidebarMenuButton
        asChild
        tooltip={item.label}
        isActive={active}
        onClick={() => {
          handleClick();
          handleNavigation();
        }}
        className="!border !border-sidebar-border/40 !bg-sidebar !text-sidebar-foreground hover:!bg-sidebar hover:!text-sidebar-foreground data-[active=true]:!bg-sidebar-accent data-[active=true]:!text-sidebar-accent-foreground"
      >
        <Link href={item.path || '#'}>
          {item.icon && <item.icon />}
          <span>{item.label}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
