import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

import { CallForm } from "../components/call-form";
import { PageHeader } from "@/components/page-header";
import { PageTitle } from "@/components/page-title";
import { PermissionGuard } from "@/components/auth/permission-guard";

export const metadata = {
  title: "Create Call",
};

export default function CreateCallPage() {
  return (
    <PermissionGuard 
      requiredPermission="call:create"
      unauthorizedTitle="Access Denied to Create Call"
      unauthorizedDescription="You don't have permission to create new call records."
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <PageHeader>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/calls">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Calls
              </Link>
            </Button>
          </PageHeader>
        </div>

        <div className="max-w-2xl">
          <PageTitle>Create Call</PageTitle>
          
          <div className="mt-6">
            <CallForm />
          </div>
        </div>
      </div>
    </PermissionGuard>
  );
}
