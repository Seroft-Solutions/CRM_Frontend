import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

import { SourceForm } from "../../components/source-form";
import { PageHeader } from "@/components/page-header";
import { PageTitle } from "@/components/page-title";
import { PermissionGuard } from "@/components/auth/permission-guard";

interface EditSourcePageProps {
  params: Promise<{
    id: string;
  }>;
}

export const metadata = {
  title: "Edit Source",
};

export default async function EditSourcePage({ params }: EditSourcePageProps) {
  const { id: idParam } = await params;
  const id = parseInt(idParam, 10);

  return (
    <PermissionGuard 
      requiredPermission="source:update"
      unauthorizedTitle="Access Denied to Edit Source"
      unauthorizedDescription="You don't have permission to edit source records."
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
        </div>

        <div className="max-w-2xl">
          <PageTitle>Edit Source</PageTitle>
          
          <div className="mt-6">
            <SourceForm id={id} />
          </div>
        </div>
      </div>
    </PermissionGuard>
  );
}
