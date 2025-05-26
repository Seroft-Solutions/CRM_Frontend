import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

import { CallTypeForm } from "../../components/call-type-form";
import { PageHeader } from "@/components/page-header";
import { PageTitle } from "@/components/page-title";
import { PermissionGuard } from "@/components/auth/permission-guard";

interface EditCallTypePageProps {
  params: Promise<{
    id: string;
  }>;
}

export const metadata = {
  title: "Edit CallType",
};

export default async function EditCallTypePage({ params }: EditCallTypePageProps) {
  const { id: idParam } = await params;
  const id = parseInt(idParam, 10);

  return (
    <PermissionGuard 
      requiredPermission="callType:update"
      unauthorizedTitle="Access Denied to Edit Call Type"
      unauthorizedDescription="You don't have permission to edit call type records."
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
          <PageTitle>Edit Call Type</PageTitle>
          
          <div className="mt-6">
            <CallTypeForm id={id} />
          </div>
        </div>
      </div>
    </PermissionGuard>
  );
}
