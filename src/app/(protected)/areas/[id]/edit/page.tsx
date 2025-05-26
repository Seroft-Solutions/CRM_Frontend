import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

import { AreaForm } from "../../components/area-form";
import { PageHeader } from "@/components/page-header";
import { PageTitle } from "@/components/page-title";
import { PermissionGuard } from "@/components/auth/permission-guard";

interface EditAreaPageProps {
  params: Promise<{
    id: string;
  }>;
}

export const metadata = {
  title: "Edit Area",
};

export default async function EditAreaPage({ params }: EditAreaPageProps) {
  const { id: idParam } = await params;
  const id = parseInt(idParam, 10);

  return (
    <PermissionGuard 
      requiredPermission="area:update"
      unauthorizedTitle="Access Denied to Edit Area"
      unauthorizedDescription="You don't have permission to edit area records."
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
        </div>

        <div className="max-w-2xl">
          <PageTitle>Edit Area</PageTitle>
          
          <div className="mt-6">
            <AreaForm id={id} />
          </div>
        </div>
      </div>
    </PermissionGuard>
  );
}
