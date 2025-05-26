import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

import { StateForm } from "../../components/state-form";
import { PageHeader } from "@/components/page-header";
import { PageTitle } from "@/components/page-title";
import { PermissionGuard } from "@/components/auth/permission-guard";

interface EditStatePageProps {
  params: Promise<{
    id: string;
  }>;
}

export const metadata = {
  title: "Edit State",
};

export default async function EditStatePage({ params }: EditStatePageProps) {
  const { id: idParam } = await params;
  const id = parseInt(idParam, 10);

  return (
    <PermissionGuard 
      requiredPermission="state:update"
      unauthorizedTitle="Access Denied to Edit State"
      unauthorizedDescription="You don't have permission to edit state records."
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
        </div>

        <div className="max-w-2xl">
          <PageTitle>Edit State</PageTitle>
          
          <div className="mt-6">
            <StateForm id={id} />
          </div>
        </div>
      </div>
    </PermissionGuard>
  );
}
