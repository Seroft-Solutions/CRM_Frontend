import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

import { CallStatusForm } from "../../components/call-status-form";
import { PageHeader } from "@/components/page-header";
import { PageTitle } from "@/components/page-title";
import { PermissionGuard } from "@/components/auth/permission-guard";

interface EditCallStatusPageProps {
  params: Promise<{
    id: string;
  }>;
}

export const metadata = {
  title: "Edit CallStatus",
};

export default async function EditCallStatusPage({ params }: EditCallStatusPageProps) {
  const { id: idParam } = await params;
  const id = parseInt(idParam, 10);

  return (
    <PermissionGuard 
      requiredPermission="callStatus:update"
      unauthorizedTitle="Access Denied to Edit Call Status"
      unauthorizedDescription="You don't have permission to edit call status records."
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
        </div>

        <div className="max-w-2xl">
          <PageTitle>Edit Call Status</PageTitle>
          
          <div className="mt-6">
            <CallStatusForm id={id} />
          </div>
        </div>
      </div>
    </PermissionGuard>
  );
}
