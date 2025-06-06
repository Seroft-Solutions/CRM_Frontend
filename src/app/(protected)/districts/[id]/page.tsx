import Link from "next/link";
import { ArrowLeft, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";

import { DistrictDetails } from "../components/district-details";
import { PageHeader } from "@/components/page-header";
import { PageTitle } from "@/components/page-title";
import { PermissionGuard, InlinePermissionGuard } from "@/components/auth/permission-guard";

interface DistrictPageProps {
  params: Promise<{
    id: string;
  }>;
}

export const metadata = {
  title: "District Details",
};

export default async function DistrictPage({ params }: DistrictPageProps) {
  const { id: idParam } = await params;
  const id = parseInt(idParam, 10);

  return (
    <PermissionGuard 
      requiredPermission="district:read"
      unauthorizedTitle="Access Denied to District Details"
      unauthorizedDescription="You don't have permission to view this district."
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <PageHeader>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/districts">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Districts
              </Link>
            </Button>
          </PageHeader>
        </div>

        <div className="max-w-4xl">
          <PageTitle>District Details</PageTitle>
          
          <div className="mt-6">
            <DistrictDetails id={id} />
          </div>
        </div>
      </div>
    </PermissionGuard>
  );
}
