import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

import { SubCallTypeForm } from "../../components/sub-call-type-form";
import { PageHeader } from "@/components/page-header";
import { PageTitle } from "@/components/page-title";
import { PermissionGuard } from "@/components/auth/permission-guard";

interface EditSubCallTypePageProps {
  params: Promise<{
    id: string;
  }>;
}

export const metadata = {
  title: "Edit SubCallType",
};

export default async function EditSubCallTypePage({ params }: EditSubCallTypePageProps) {
  const { id: idParam } = await params;
  const id = parseInt(idParam, 10);

  return (
    <PermissionGuard 
      requiredPermission="subCallType:update"
      unauthorizedTitle="Access Denied to Edit Sub Call Type"
      unauthorizedDescription="You don't have permission to edit sub call type records."
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
          <PageTitle>Edit Sub Call Type</PageTitle>
          
          <div className="mt-6">
            <SubCallTypeForm id={id} />
          </div>
        </div>
      </div>
    </PermissionGuard>
  );
}
