import Link from "next/link";
import { ArrowLeft, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";

import { CallStatusDetails } from "../components/call-status-details";
import { PageHeader } from "@/components/page-header";
import { PageTitle } from "@/components/page-title";
import { PermissionGuard, InlinePermissionGuard } from "@/components/auth/permission-guard";

interface CallStatusPageProps {
  params: Promise<{
    id: string;
  }>;
}

export const metadata = {
  title: "CallStatus Details",
};

export default async function CallStatusPage({ params }: CallStatusPageProps) {
  const { id: idParam } = await params;
  const id = parseInt(idParam, 10);

  return (
    <PermissionGuard 
      requiredPermission="callStatus:read"
      unauthorizedTitle="Access Denied to Call Status Details"
      unauthorizedDescription="You don't have permission to view this call status."
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
          <InlinePermissionGuard requiredPermission="callStatus:update">
            <Button size="sm" asChild className="shrink-0">
              <Link href={`/call-statuses/${id}/edit`}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </Link>
            </Button>
          </InlinePermissionGuard>
        </div>

        <div className="max-w-4xl">
          <PageTitle>Call Status Details</PageTitle>
          
          <div className="mt-6">
            <CallStatusDetails id={id} />
          </div>
        </div>
      </div>
    </PermissionGuard>
  );
}
