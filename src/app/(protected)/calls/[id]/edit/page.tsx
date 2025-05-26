import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

import { CallForm } from "../../components/call-form";
import { PageHeader } from "@/components/page-header";
import { PageTitle } from "@/components/page-title";
import { PermissionGuard } from "@/components/auth/permission-guard";

interface EditCallPageProps {
  params: Promise<{
    id: string;
  }>;
}

export const metadata = {
  title: "Edit Call",
};

export default async function EditCallPage({ params }: EditCallPageProps) {
  const { id: idParam } = await params;
  const id = parseInt(idParam, 10);

  return (
    <PermissionGuard 
      requiredPermission="call:update"
      unauthorizedTitle="Access Denied to Edit Call"
      unauthorizedDescription="You don't have permission to edit call records."
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
          <PageTitle>Edit Call</PageTitle>
          
          <div className="mt-6">
            <CallForm id={id} />
          </div>
        </div>
      </div>
    </PermissionGuard>
  );
}
