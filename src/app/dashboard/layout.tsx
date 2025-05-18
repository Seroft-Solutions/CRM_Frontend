'use client';

import { DashboardLayout } from "@/features/dashboard";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";

export default function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();

  // Check if the user is authenticated
  if (status === "loading") {
    // Return a loading state while checking authentication
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="mt-4 text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (status === "unauthenticated") {
    redirect("/login");
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}
