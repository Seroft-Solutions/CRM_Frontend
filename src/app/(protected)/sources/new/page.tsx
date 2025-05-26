import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

import { SourceForm } from "../components/source-form";
import { PageHeader } from "@/components/page-header";
import { PageTitle } from "@/components/page-title";
import { PermissionGuard } from "@/components/auth/permission-guard";

export const metadata = {
  title: "Create Source",
};

export default function CreateSourcePage() {
  return (
    <PermissionGuard 
      requiredPermission="source:create"
      unauthorizedTitle="Access Denied to Create Source"
      unauthorizedDescription="You don't have permission to create new source records."
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
          <PageTitle>Create Source</PageTitle>
          
          <div className="mt-6">
            <SourceForm />
          </div>
        </div>
      </div>
    </PermissionGuard>
  );
}
