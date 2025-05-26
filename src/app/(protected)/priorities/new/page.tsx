import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

import { PriorityForm } from "../components/priority-form";
import { PageHeader } from "@/components/page-header";
import { PageTitle } from "@/components/page-title";
import { PermissionGuard } from "@/components/auth/permission-guard";

export const metadata = {
  title: "Create Priority",
};

export default function CreatePriorityPage() {
  return (
    <PermissionGuard 
      requiredPermission="priority:create"
      unauthorizedTitle="Access Denied to Create Priority"
      unauthorizedDescription="You don't have permission to create new priority records."
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <PageHeader>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/priorities">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Priorities
              </Link>
            </Button>
          </PageHeader>
        </div>

        <div className="max-w-2xl">
          <PageTitle>Create Priority</PageTitle>
          
          <div className="mt-6">
            <PriorityForm />
          </div>
        </div>
      </div>
    </PermissionGuard>
  );
}
