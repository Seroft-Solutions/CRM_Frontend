'use client';

import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { DynamicBreadcrumbs } from "@/components/breadcrumbs/dynamic-breadcrumbs";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { useEffect } from "react";
import { useTenantSetup } from "@/hooks/useTenantSetup";
import { TenantSetupWizard } from "@/components/tenant-setup";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const tenantSetup = useTenantSetup();

  // Handle authentication redirect
  useEffect(() => {
    if (status === "unauthenticated") {
      redirect("/login");
    }
  }, [status]);

  // Show loading state while checking authentication
  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="mt-4 text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, show nothing (redirect will happen)
  if (status === "unauthenticated") {
    return null;
  }

  // Check if tenant setup is required
  if (tenantSetup.state.isSetupRequired && !tenantSetup.state.isSetupCompleted) {
    return <TenantSetupWizard tenantSetup={tenantSetup} />;
  }

  // If authenticated and tenant is set up, render the dashboard layout
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <DynamicBreadcrumbs />
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 overflow-x-hidden">
          <div className="container mx-auto ">
            {children}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
