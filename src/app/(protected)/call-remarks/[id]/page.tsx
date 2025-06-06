import Link from "next/link";
import { ArrowLeft, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";

import { CallRemarkDetails } from "../components/call-remark-details";
import { PageHeader } from "@/components/page-header";
import { PageTitle } from "@/components/page-title";
import { PermissionGuard, InlinePermissionGuard } from "@/components/auth/permission-guard";

interface CallRemarkPageProps {
  params: Promise<{
    id: string;
  }>;
}

export const metadata = {
  title: "CallRemark Details",
};

export default async function CallRemarkPage({ params }: CallRemarkPageProps) {
  const { id: idParam } = await params;
  const id = parseInt(idParam, 10);

  return (
    <PermissionGuard 
      requiredPermission="callRemark:read"
      unauthorizedTitle="Access Denied to Call Remark Details"
      unauthorizedDescription="You don't have permission to view this call remark."
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

        <div className="max-w-4xl">
          <PageTitle>Call Remark Details</PageTitle>
          
          <div className="mt-6">
            <CallRemarkDetails id={id} />
          </div>
        </div>
      </div>
    </PermissionGuard>
  );
}
