import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

import { PriorityForm } from "../../components/priority-form";
import { PageHeader } from "@/components/page-header";
import { PageTitle } from "@/components/page-title";
import { PermissionGuard } from "@/components/auth/permission-guard";

interface EditPriorityPageProps {
  params: Promise<{
    id: string;
  }>;
}

export const metadata = {
  title: "Edit Priority",
};

export default async function EditPriorityPage({ params }: EditPriorityPageProps) {
  const { id: idParam } = await params;
  const id = parseInt(idParam, 10);

  return (
    <PermissionGuard 
      requiredPermission="priority:update"
      unauthorizedTitle="Access Denied to Edit Priority"
      unauthorizedDescription="You don't have permission to edit priority records."
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <PageHeader>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/priorities">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Priorities
              </Link>
            </Button>
          </PageHeader>
        </div>

        <div className="max-w-2xl">
          <PageTitle>Edit Priority</PageTitle>
          
          <div className="mt-6">
            <PriorityForm id={id} />
          </div>
        </div>
      </div>
    </PermissionGuard>
  );
}
