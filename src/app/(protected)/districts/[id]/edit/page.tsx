import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

import { DistrictForm } from "../../components/district-form";
import { PageHeader } from "@/components/page-header";
import { PageTitle } from "@/components/page-title";
import { PermissionGuard } from "@/components/auth/permission-guard";

interface EditDistrictPageProps {
  params: Promise<{
    id: string;
  }>;
}

export const metadata = {
  title: "Edit District",
};

export default async function EditDistrictPage({ params }: EditDistrictPageProps) {
  const { id: idParam } = await params;
  const id = parseInt(idParam, 10);

  return (
    <PermissionGuard 
      requiredPermission="district:update"
      unauthorizedTitle="Access Denied to Edit District"
      unauthorizedDescription="You don't have permission to edit district records."
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

        <div className="max-w-2xl">
          <PageTitle>Edit District</PageTitle>
          
          <div className="mt-6">
            <DistrictForm id={id} />
          </div>
        </div>
      </div>
    </PermissionGuard>
  );
}
