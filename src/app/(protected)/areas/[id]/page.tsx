import Link from "next/link";
import { ArrowLeft, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";

import { AreaDetails } from "../components/area-details";
import { PageHeader } from "@/components/page-header";
import { PageTitle } from "@/components/page-title";
import { PermissionGuard, InlinePermissionGuard } from "@/components/auth/permission-guard";

interface AreaPageProps {
  params: Promise<{
    id: string;
  }>;
}

export const metadata = {
  title: "Area Details",
};

export default async function AreaPage({ params }: AreaPageProps) {
  const { id: idParam } = await params;
  const id = parseInt(idParam, 10);

  return (
    <PermissionGuard 
      requiredPermission="area:read"
      unauthorizedTitle="Access Denied to Area Details"
      unauthorizedDescription="You don't have permission to view this area."
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <PageHeader>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/areas">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Areas
              </Link>
            </Button>
          </PageHeader>
          <InlinePermissionGuard requiredPermission="area:update">
            <Button size="sm" asChild className="shrink-0">
              <Link href={`/areas/${id}/edit`}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </Link>
            </Button>
          </InlinePermissionGuard>
        </div>

        <div className="max-w-4xl">
          <PageTitle>Area Details</PageTitle>
          
          <div className="mt-6">
            <AreaDetails id={id} />
          </div>
        </div>
      </div>
    </PermissionGuard>
  );
}
