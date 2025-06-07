import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

import { CallForm } from "../../components/call-form";
import { PageHeader } from "@/components/page-header";
import { PageTitle } from "@/components/page-title";
import { PermissionGuard } from "@/components/auth/permission-guard";

interface EditCallPageProps {
  params: Promise<{
    id: string;
  }>;
}

export const metadata = {
  title: "Edit Call",
};

export default async function EditCallPage({ params }: EditCallPageProps) {
  const { id: idParam } = await params;
  const id = parseInt(idParam, 10);

  return (
    <PermissionGuard 
      requiredPermission="call:update"
      unauthorizedTitle="Access Denied to Edit Call"
      unauthorizedDescription="You don't have permission to edit call records."
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <PageHeader>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/calls">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Calls
              </Link>
            </Button>
          </PageHeader>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-8 bg-blue-600 rounded-full"></div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Edit Call</h1>
              <p className="text-sm text-gray-600 mt-1">Update the information for this call</p>
            </div>
          </div>
          
          <CallForm id={id} />
        </div>
      </div>
    </PermissionGuard>
  );
}
