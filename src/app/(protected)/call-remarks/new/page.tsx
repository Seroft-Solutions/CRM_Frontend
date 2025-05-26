import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

import { CallRemarkForm } from "../components/call-remark-form";
import { PageHeader } from "@/components/page-header";
import { PageTitle } from "@/components/page-title";
import { PermissionGuard } from "@/components/auth/permission-guard";

export const metadata = {
  title: "Create CallRemark",
};

export default function CreateCallRemarkPage() {
  return (
    <PermissionGuard 
      requiredPermission="callRemark:create"
      unauthorizedTitle="Access Denied to Create Call Remark"
      unauthorizedDescription="You don't have permission to create new call remark records."
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <PageHeader>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/call-remarks">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Call Remarks
              </Link>
            </Button>
          </PageHeader>
        </div>

        <div className="max-w-2xl">
          <PageTitle>Create Call Remark</PageTitle>
          
          <div className="mt-6">
            <CallRemarkForm />
          </div>
        </div>
      </div>
    </PermissionGuard>
  );
}
