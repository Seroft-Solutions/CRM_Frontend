import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { DynamicBreadcrumbs } from "@/components/breadcrumbs/dynamic-breadcrumbs";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { auth } from "@/auth"; // Import server-side auth
import { redirect } from "next/navigation"; // Ensure redirect is imported

export default async function DashboardLayout({ // Add async
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth(); // Fetch session server-side
  if (!session) { // Check session
    redirect("/login"); // Redirect if no session
  }

  // If authenticated, render the dashboard layout
  return (
    <SidebarProvider>
      <AppSidebar session={session} />
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
        <div className="flex flex-1 flex-col gap-4 p-4">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
