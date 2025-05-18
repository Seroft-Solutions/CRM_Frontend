'use client';

import { useState } from 'react';
import { 
  SidebarProvider, 
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarSeparator,
  SidebarTrigger
} from '@/components/ui/sidebar';
import { CRMSidebar } from './CRMSidebar';
import { useSession } from 'next-auth/react';
import { useGetAccount } from '@/core/api/generated/endpoints/account-resource/account-resource.gen';
import { Button } from '@/components/ui/button';
import { Bell, Search, Settings, User } from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { signOut } from 'next-auth/react';
import { Input } from '@/components/ui/input';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { data: session } = useSession();
  const { data: account } = useGetAccount();
  const [search, setSearch] = useState('');

  return (
    <SidebarProvider>
      <div className="flex h-screen overflow-hidden">
        <CRMSidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="border-b bg-background">
            <div className="flex h-16 items-center px-4 gap-4">
              <SidebarTrigger className="lg:hidden" />
              <div className="relative max-w-md w-full">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search for anything..."
                  className="w-full pl-8 bg-background"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="ml-auto flex items-center gap-2">
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Bell className="h-4 w-4" />
                  <span className="sr-only">Notifications</span>
                </Button>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Settings className="h-4 w-4" />
                  <span className="sr-only">Settings</span>
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full">
                      <User className="h-4 w-4" />
                      <span className="sr-only">User menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <div className="flex items-center justify-start gap-2 p-2">
                      <div className="flex flex-col space-y-1 leading-none">
                        <p className="font-medium">{account?.firstName} {account?.lastName}</p>
                        <p className="text-xs text-muted-foreground">{account?.email}</p>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => signOut({redirect:true, redirectTo: '/'})}>
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </header>
          <main className="flex-1 overflow-auto p-4">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
