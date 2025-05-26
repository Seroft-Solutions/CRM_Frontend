import Link from "next/link";
import { ArrowLeft, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";

import { SourceDetails } from "../components/source-details";
import { PageHeader } from "@/components/page-header";
import { PageTitle } from "@/components/page-title";
import { PermissionGuard, InlinePermissionGuard } from "@/components/auth/permission-guard";

interface SourcePageProps {
  params: Promise<{
    id: string;
  }>;
}

export const metadata = {
  title: "Source Details",
};

export default async function SourcePage({ params }: SourcePageProps) {
  const { id: idParam } = await params;
  const id = parseInt(idParam, 10);

  return (
    <PermissionGuard 
      requiredPermission="source:read"
      unauthorizedTitle="Access Denied to Source Details"
      unauthorizedDescription="You don't have permission to view this source."
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <PageHeader>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/sources">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Sources
              </Link>
            </Button>
          </PageHeader>
          <InlinePermissionGuard requiredPermission="source:update">
            <Button size="sm" asChild className="shrink-0">
              <Link href={`/sources/${id}/edit`}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </Link>
            </Button>
          </InlinePermissionGuard>
        </div>

        <div className="max-w-4xl">
          <PageTitle>Source Details</PageTitle>
          
          <div className="mt-6">
            <SourceDetails id={id} />
          </div>
        </div>
      </div>
    </PermissionGuard>
  );
}
