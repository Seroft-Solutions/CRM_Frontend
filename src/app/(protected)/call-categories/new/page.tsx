import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

import { CallCategoryForm } from "../components/call-category-form";
import { PageHeader } from "@/components/page-header";
import { PageTitle } from "@/components/page-title";
import { PermissionGuard } from "@/components/auth/permission-guard";

export const metadata = {
  title: "Create CallCategory",
};

export default function CreateCallCategoryPage() {
  return (
    <PermissionGuard 
      requiredPermission="callCategory:create"
      unauthorizedTitle="Access Denied to Create Call Category"
      unauthorizedDescription="You don't have permission to create new call category records."
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <PageHeader>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/call-categories">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Call Categories
              </Link>
            </Button>
          </PageHeader>
        </div>

        <div className="max-w-2xl">
          <PageTitle>Create Call Category</PageTitle>
          
          <div className="mt-6">
            <CallCategoryForm />
          </div>
        </div>
      </div>
    </PermissionGuard>
  );
}
