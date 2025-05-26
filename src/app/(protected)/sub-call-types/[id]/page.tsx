import Link from "next/link";
import { ArrowLeft, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";

import { SubCallTypeDetails } from "../components/sub-call-type-details";
import { PageHeader } from "@/components/page-header";
import { PageTitle } from "@/components/page-title";
import { PermissionGuard, InlinePermissionGuard } from "@/components/auth/permission-guard";

interface SubCallTypePageProps {
  params: Promise<{
    id: string;
  }>;
}

export const metadata = {
  title: "SubCallType Details",
};

export default async function SubCallTypePage({ params }: SubCallTypePageProps) {
  const { id: idParam } = await params;
  const id = parseInt(idParam, 10);

  return (
    <PermissionGuard 
      requiredPermission="subCallType:read"
      unauthorizedTitle="Access Denied to Sub Call Type Details"
      unauthorizedDescription="You don't have permission to view this sub call type."
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
          <InlinePermissionGuard requiredPermission="subCallType:update">
            <Button size="sm" asChild className="shrink-0">
              <Link href={`/sub-call-types/${id}/edit`}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </Link>
            </Button>
          </InlinePermissionGuard>
        </div>

        <div className="max-w-4xl">
          <PageTitle>Sub Call Type Details</PageTitle>
          
          <div className="mt-6">
            <SubCallTypeDetails id={id} />
          </div>
        </div>
      </div>
    </PermissionGuard>
  );
}
