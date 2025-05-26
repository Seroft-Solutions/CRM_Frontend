import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

import { DistrictForm } from "../components/district-form";
import { PageHeader } from "@/components/page-header";
import { PageTitle } from "@/components/page-title";
import { PermissionGuard } from "@/components/auth/permission-guard";

export const metadata = {
  title: "Create District",
};

export default function CreateDistrictPage() {
  return (
    <PermissionGuard 
      requiredPermission="district:create"
      unauthorizedTitle="Access Denied to Create District"
      unauthorizedDescription="You don't have permission to create new district records."
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
          <PageTitle>Create District</PageTitle>
          
          <div className="mt-6">
            <DistrictForm />
          </div>
        </div>
      </div>
    </PermissionGuard>
  );
}
