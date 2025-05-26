import Link from "next/link";
import { ArrowLeft, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";

import { StateDetails } from "../components/state-details";
import { PageHeader } from "@/components/page-header";
import { PageTitle } from "@/components/page-title";
import { PermissionGuard, InlinePermissionGuard } from "@/components/auth/permission-guard";

interface StatePageProps {
  params: Promise<{
    id: string;
  }>;
}

export const metadata = {
  title: "State Details",
};

export default async function StatePage({ params }: StatePageProps) {
  const { id: idParam } = await params;
  const id = parseInt(idParam, 10);

  return (
    <PermissionGuard 
      requiredPermission="state:read"
      unauthorizedTitle="Access Denied to State Details"
      unauthorizedDescription="You don't have permission to view this state."
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <PageHeader>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/states">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to States
              </Link>
            </Button>
          </PageHeader>
          <InlinePermissionGuard requiredPermission="state:update">
            <Button size="sm" asChild className="shrink-0">
              <Link href={`/states/${id}/edit`}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </Link>
            </Button>
          </InlinePermissionGuard>
        </div>

        <div className="max-w-4xl">
          <PageTitle>State Details</PageTitle>
          
          <div className="mt-6">
            <StateDetails id={id} />
          </div>
        </div>
      </div>
    </PermissionGuard>
  );
}
