import Link from "next/link";
import { ArrowLeft, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";

import { CallCategoryDetails } from "../components/call-category-details";
import { PageHeader } from "@/components/page-header";
import { PageTitle } from "@/components/page-title";
import { PermissionGuard, InlinePermissionGuard } from "@/components/auth/permission-guard";

interface CallCategoryPageProps {
  params: Promise<{
    id: string;
  }>;
}

export const metadata = {
  title: "CallCategory Details",
};

export default async function CallCategoryPage({ params }: CallCategoryPageProps) {
  const { id: idParam } = await params;
  const id = parseInt(idParam, 10);

  return (
    <PermissionGuard 
      requiredPermission="callCategory:read"
      unauthorizedTitle="Access Denied to Call Category Details"
      unauthorizedDescription="You don't have permission to view this call category."
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

        <div className="max-w-4xl">
          <PageTitle>Call Category Details</PageTitle>
          
          <div className="mt-6">
            <CallCategoryDetails id={id} />
          </div>
        </div>
      </div>
    </PermissionGuard>
  );
}
