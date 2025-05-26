import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

import { CallTypeForm } from "../components/call-type-form";
import { PageHeader } from "@/components/page-header";
import { PageTitle } from "@/components/page-title";
import { PermissionGuard } from "@/components/auth/permission-guard";

export const metadata = {
  title: "Create CallType",
};

export default function CreateCallTypePage() {
  return (
    <PermissionGuard 
      requiredPermission="callType:create"
      unauthorizedTitle="Access Denied to Create Call Type"
      unauthorizedDescription="You don't have permission to create new call type records."
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <PageHeader>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/call-types">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Call Types
              </Link>
            </Button>
          </PageHeader>
        </div>

        <div className="max-w-2xl">
          <PageTitle>Create Call Type</PageTitle>
          
          <div className="mt-6">
            <CallTypeForm />
          </div>
        </div>
      </div>
    </PermissionGuard>
  );
}
