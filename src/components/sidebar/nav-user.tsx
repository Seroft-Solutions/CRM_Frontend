'use client';

import { BadgeCheck, Bell, Building, ChevronsUpDown, LogOut, User, Shield } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { logoutAction } from '@/core/auth';
import { logoutWithCleanup } from '@/core/auth';
import { useAccount } from '@/core/auth/hooks/use-account';

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
  const { status } = useSession();

  // Use the enhanced account hook with optimized caching and error handling
  const { user, isLoading, error } = useAccount({
    refetchInBackground: true, // Keep user data fresh in background
    refetchOnWindowFocus: true, // Refetch when user returns to tab
  });

  // Handle logout with proper cleanup
  const handleLogout = async () => {
    try {
      await logoutWithCleanup();
    } catch (error) {
      console.error('Logout failed:', error);
      // Fallback to server action if client-side logout fails
      const form = document.createElement('form');
      form.action = '/api/auth/signout';
      form.method = 'POST';
      document.body.appendChild(form);
      form.submit();
    }
  };

  if (status === 'loading' || isLoading) {
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
  if (error) {
    console.warn('Failed to fetch account data:', error);
  }

  // Fallback user data if account API fails but session exists
  const displayUser = user || {
    name: 'User',
    email: '',
    image: '',
    initials: 'U',
    role: null,
    authorities: [],
    activated: undefined,
    login: undefined,
  };

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
                {displayUser.image ? (
                  <AvatarImage src={displayUser.image} alt={displayUser.name} />
                ) : null}
                <AvatarFallback className="rounded-lg">{displayUser.initials}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{displayUser.name}</span>
                <span className="truncate text-xs">{displayUser.email}</span>
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
                  {displayUser.image ? (
                    <AvatarImage src={displayUser.image} alt={displayUser.name} />
                  ) : null}
                  <AvatarFallback className="rounded-lg">{displayUser.initials}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{displayUser.name}</span>
                  <span className="truncate text-xs">{displayUser.email}</span>
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
              {displayUser.authorities.includes('ROLE_ADMIN') && (
                <DropdownMenuItem>
                  <Shield className="h-4 w-4 mr-2" />
                  Admin Panel
                </DropdownMenuItem>
              )}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
