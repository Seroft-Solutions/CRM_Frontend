import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

import { SubCallTypeForm } from "../components/sub-call-type-form";
import { PageHeader } from "@/components/page-header";
import { PageTitle } from "@/components/page-title";
import { PermissionGuard } from "@/components/auth/permission-guard";

export const metadata = {
  title: "Create SubCallType",
};

export default function CreateSubCallTypePage() {
  return (
    <PermissionGuard 
      requiredPermission="subCallType:create"
      unauthorizedTitle="Access Denied to Create Sub Call Type"
      unauthorizedDescription="You don't have permission to create new sub call type records."
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <PageHeader>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/sub-call-types">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Sub Call Types
              </Link>
            </Button>
          </PageHeader>
        </div>

        <div className="max-w-2xl">
          <PageTitle>Create Sub Call Type</PageTitle>
          
          <div className="mt-6">
            <SubCallTypeForm />
          </div>
        </div>
      </div>
    </PermissionGuard>
  );
}
