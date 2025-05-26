import Link from "next/link";
import { ArrowLeft, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";

import { CallTypeDetails } from "../components/call-type-details";
import { PageHeader } from "@/components/page-header";
import { PageTitle } from "@/components/page-title";
import { PermissionGuard, InlinePermissionGuard } from "@/components/auth/permission-guard";

interface CallTypePageProps {
  params: Promise<{
    id: string;
  }>;
}

export const metadata = {
  title: "CallType Details",
};

export default async function CallTypePage({ params }: CallTypePageProps) {
  const { id: idParam } = await params;
  const id = parseInt(idParam, 10);

  return (
    <PermissionGuard 
      requiredPermission="callType:read"
      unauthorizedTitle="Access Denied to Call Type Details"
      unauthorizedDescription="You don't have permission to view this call type."
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
          <InlinePermissionGuard requiredPermission="callType:update">
            <Button size="sm" asChild className="shrink-0">
              <Link href={`/call-types/${id}/edit`}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </Link>
            </Button>
          </InlinePermissionGuard>
        </div>

        <div className="max-w-4xl">
          <PageTitle>Call Type Details</PageTitle>
          
          <div className="mt-6">
            <CallTypeDetails id={id} />
          </div>
        </div>
      </div>
    </PermissionGuard>
  );
}
