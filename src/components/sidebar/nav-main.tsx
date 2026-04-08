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
  SidebarMenuAction,
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
    if (item.path && (pathname === item.path || pathname.startsWith(item.path + '/'))) {
      return true;
    }

    if (item.children) {
      return item.children.some((child) => isActive(child));
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

function getVisibleChildren(
  items: SidebarItem[] | undefined,
  hasPermission: (requiredPermission?: string) => boolean
) {
  return (
    items?.filter((child) => {
      const childHasPermission = hasPermission(child.requiredPermission);

      if (child.requiredPermission && !childHasPermission) {
        return false;
      }

      if (!child.children) {
        return true;
      }

      return getVisibleChildren(child.children, hasPermission).length > 0;
    }) ?? []
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

  const visibleChildren = getVisibleChildren(item.children, hasPermission);

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
        defaultOpen={item.expandable ?? active}
        className="group/collapsible"
      >
        <SidebarMenuItem>
          {item.path ? (
            <SidebarMenuButton
              asChild
              tooltip={item.label}
              isActive={active}
              onClick={() => {
                handleClick();
                handleNavigation();
              }}
              className={cn(
                '!border !border-sidebar-border/40 !bg-sidebar !text-sidebar-foreground hover:!bg-sidebar hover:!text-sidebar-foreground',
                active && '!bg-sidebar-accent !text-sidebar-accent-foreground'
              )}
            >
              <Link href={item.path}>
                {item.icon && <item.icon />}
                <span>{item.label}</span>
              </Link>
            </SidebarMenuButton>
          ) : (
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
          )}
          {item.path ? (
            <CollapsibleTrigger asChild>
              <SidebarMenuAction
                showOnHover
                aria-label={`Toggle ${item.label}`}
                onClick={handleClick}
                className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <ChevronRight className="transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
              </SidebarMenuAction>
            </CollapsibleTrigger>
          ) : null}
          <CollapsibleContent>
            <SidebarMenuSub>
              {visibleChildren.map((subItem) => (
                <NavSubItem
                  key={subItem.key}
                  item={subItem}
                  pathname={pathname}
                  isActive={isActive}
                  hasPermission={hasPermission}
                  onExpand={handleClick}
                  onNavigate={handleNavigation}
                  depth={1}
                />
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

function NavSubItem({
  item,
  pathname,
  isActive,
  hasPermission,
  onExpand,
  onNavigate,
  depth,
}: {
  item: SidebarItem;
  pathname: string;
  isActive: (item: SidebarItem) => boolean;
  hasPermission: (requiredPermission?: string) => boolean;
  onExpand: () => void;
  onNavigate: () => void;
  depth: number;
}) {
  const active = isActive(item);
  const visibleChildren = getVisibleChildren(item.children, hasPermission);

  if (item.children && visibleChildren.length > 0) {
    return (
      <Collapsible
        asChild
        defaultOpen={item.expandable ?? active}
        className="group/sub-collapsible"
      >
        <SidebarMenuSubItem>
          <CollapsibleTrigger asChild>
            <SidebarMenuSubButton
              isActive={active}
              onClick={onExpand}
              className={cn(
                '!bg-sidebar !text-sidebar-foreground hover:!bg-sidebar data-[active=true]:!bg-sidebar-accent data-[active=true]:!text-sidebar-accent-foreground',
                depth > 1 && 'pl-6'
              )}
            >
              <span>{item.label}</span>
              <ChevronRight className="ml-auto shrink-0 opacity-80 transition-transform duration-200 group-data-[state=open]/sub-collapsible:rotate-90" />
            </SidebarMenuSubButton>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarMenuSub>
              {visibleChildren.map((child) => (
                <NavSubItem
                  key={child.key}
                  item={child}
                  pathname={pathname}
                  isActive={isActive}
                  hasPermission={hasPermission}
                  onExpand={onExpand}
                  onNavigate={onNavigate}
                  depth={depth + 1}
                />
              ))}
            </SidebarMenuSub>
          </CollapsibleContent>
        </SidebarMenuSubItem>
      </Collapsible>
    );
  }

  return (
    <SidebarMenuSubItem>
      <SidebarMenuSubButton
        asChild
        isActive={active}
        onClick={onNavigate}
        className={cn(
          '!bg-sidebar !text-sidebar-foreground hover:!bg-sidebar data-[active=true]:!bg-sidebar-accent data-[active=true]:!text-sidebar-accent-foreground',
          depth > 1 && 'pl-6'
        )}
      >
        <Link href={item.path || '#'}>
          <span>{item.label}</span>
        </Link>
      </SidebarMenuSubButton>
    </SidebarMenuSubItem>
  );
}
