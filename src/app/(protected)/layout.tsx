import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { AppSidebar } from '@/components/sidebar/app-sidebar';
import { DynamicBreadcrumbs } from '@/components/breadcrumbs/dynamic-breadcrumbs';
import { TenantHeader } from '@/components/layout/tenant-header';
import { Separator } from '@/components/ui/separator';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { SessionManagerProvider } from '@/core/auth';
import { hasOrganization } from '@/lib/organization-utils';

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session) {
    redirect('/');
  }

  return (
    <SessionManagerProvider 
      idleTimeoutMinutes={2}
      warningBeforeLogoutMinutes={1}
    >
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex flex-col shrink-0 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
            <div className="flex h-16 items-center justify-between">
              <div className="flex items-center gap-2 px-4">
                <SidebarTrigger className="-ml-1" />
                <Separator
                  orientation="vertical"
                  className="mr-2 data-[orientation=vertical]:h-4"
                />
                <DynamicBreadcrumbs />
              </div>
              <div className="flex-1 flex justify-center px-4">
                <TenantHeader />
              </div>
              <div className="w-48"></div>
            </div>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4 overflow-x-hidden">
            <div className="container mx-auto">{children}</div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </SessionManagerProvider>
  );
}
