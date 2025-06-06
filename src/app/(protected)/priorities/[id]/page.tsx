import Link from "next/link";
import { ArrowLeft, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";

import { PriorityDetails } from "../components/priority-details";
import { PageHeader } from "@/components/page-header";
import { PageTitle } from "@/components/page-title";
import { PermissionGuard, InlinePermissionGuard } from "@/components/auth/permission-guard";

interface PriorityPageProps {
  params: Promise<{
    id: string;
  }>;
}

export const metadata = {
  title: "Priority Details",
};

export default async function PriorityPage({ params }: PriorityPageProps) {
  const { id: idParam } = await params;
  const id = parseInt(idParam, 10);

  return (
    <PermissionGuard 
      requiredPermission="priority:read"
      unauthorizedTitle="Access Denied to Priority Details"
      unauthorizedDescription="You don't have permission to view this priority."
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

        <div className="max-w-4xl">
          <PageTitle>Priority Details</PageTitle>
          
          <div className="mt-6">
            <PriorityDetails id={id} />
          </div>
        </div>
      </div>
    </PermissionGuard>
  );
}
