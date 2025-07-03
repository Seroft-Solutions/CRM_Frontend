'use client';

import { BadgeCheck, Bell, Building, ChevronsUpDown, LogOut, User, Shield } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { logoutAction } from '@/core/auth';
import { useGetAccount } from '@/core/api/generated/spring/endpoints/account-resource/account-resource.gen';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { Badge } from '@/components/ui/badge';

export function NavUser() {
  const { isMobile } = useSidebar();
  const { data: session, status } = useSession();
  
  // Fetch account details from the API
  const { 
    data: accountData, 
    isLoading: isAccountLoading, 
    error: accountError 
  } = useGetAccount({
    query: {
      enabled: status === 'authenticated', // Only fetch when authenticated
    }
  });

  const getInitials = (name: string) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const getFullName = () => {
    if (accountData?.firstName && accountData?.lastName) {
      return `${accountData.firstName} ${accountData.lastName}`;
    }
    return session?.user?.name || 'User';
  };

  const getEmail = () => {
    return accountData?.email || session?.user?.email || '';
  };

  const getImageUrl = () => {
    return accountData?.imageUrl || session?.user?.image || '';
  };

  const getPrimaryRole = () => {
    if (accountData?.authorities && accountData.authorities.length > 0) {
      // Remove 'ROLE_' prefix if present and capitalize
      return accountData.authorities[0].replace('ROLE_', '').toLowerCase();
    }
    return null;
  };

  const user = {
    name: getFullName(),
    email: getEmail(),
    image: getImageUrl(),
    initials: getInitials(getFullName()),
    role: getPrimaryRole(),
    authorities: accountData?.authorities || [],
    activated: accountData?.activated,
    login: accountData?.login,
  };

  if (status === 'loading' || isAccountLoading) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" disabled>
            <Avatar className="h-8 w-8 rounded-lg">
              <AvatarFallback className="rounded-lg">...</AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">Loading...</span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  // Handle account API error gracefully
  if (accountError) {
    console.warn('Failed to fetch account data:', accountError);
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
              <Avatar className="h-8 w-8 rounded-lg">
                {user.image ? <AvatarImage src={user.image} alt={user.name} /> : null}
                <AvatarFallback className="rounded-lg">{user.initials}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                <span className="truncate text-xs">{user.email}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? 'bottom' : 'right'}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  {user.image ? <AvatarImage src={user.image} alt={user.name} /> : null}
                  <AvatarFallback className="rounded-lg">{user.initials}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.name}</span>
                  <span className="truncate text-xs">{user.email}</span>
                  {user.role && (
                    <div className="flex items-center gap-1 mt-1">
                      <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                        {user.role}
                      </Badge>
                      {user.activated === false && (
                        <Badge variant="destructive" className="text-xs px-1.5 py-0.5">
                          Inactive
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <User className="h-4 w-4 mr-2" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Bell className="h-4 w-4 mr-2" />
                Notifications
              </DropdownMenuItem>
              {user.authorities.includes('ROLE_ADMIN') && (
                <DropdownMenuItem>
                  <Shield className="h-4 w-4 mr-2" />
                  Admin Panel
                </DropdownMenuItem>
              )}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <form action={logoutAction}>
                <button type="submit" className="flex w-full items-center">
                  <LogOut className="h-4 w-4 mr-2" />
                  Log out
                </button>
              </form>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
