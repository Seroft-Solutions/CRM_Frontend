import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

import { CallStatusForm } from "../components/call-status-form";
import { PageHeader } from "@/components/page-header";
import { PageTitle } from "@/components/page-title";
import { PermissionGuard } from "@/components/auth/permission-guard";

export const metadata = {
  title: "Create CallStatus",
};

export default function CreateCallStatusPage() {
  return (
    <PermissionGuard 
      requiredPermission="callStatus:create"
      unauthorizedTitle="Access Denied to Create Call Status"
      unauthorizedDescription="You don't have permission to create new call status records."
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <PageHeader>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/call-statuses">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Call Statuses
              </Link>
            </Button>
          </PageHeader>
        </div>

        <div className="max-w-2xl">
          <PageTitle>Create Call Status</PageTitle>
          
          <div className="mt-6">
            <CallStatusForm />
          </div>
        </div>
      </div>
    </PermissionGuard>
  );
}
