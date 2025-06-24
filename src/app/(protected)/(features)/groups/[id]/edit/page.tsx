import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

import { GroupForm } from "../../components/group-form";
import { PageHeader } from "@/components/page-header";
import { PageTitle } from "@/components/page-title";
import { PermissionGuard } from "@/components/auth/permission-guard";
import { ContextAwareBackButton } from "@/components/context-aware-back-button";

interface EditGroupPageProps {
  params: Promise<{
    id: string;
  }>;
}

export const metadata = {
  title: "Edit Group",
};

export default async function EditGroupPage({ params }: EditGroupPageProps) {
  const { id: idParam } = await params;
  const id = parseInt(idParam, 10);

  return (
    <PermissionGuard 
      requiredPermission="group:update"
      unauthorizedTitle="Access Denied to Edit Group"
      unauthorizedDescription="You don't have permission to edit group records."
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <PageHeader>
            <ContextAwareBackButton 
              defaultRoute="/groups"
              defaultLabel="Back to Groups"
              entityName="Group"
            />
          </PageHeader>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-8 bg-blue-600 rounded-full"></div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Edit Group</h1>
              <p className="text-sm text-gray-600 mt-1">Update the information for this group</p>
            </div>
          </div>
          
          <GroupForm id={id} />
        </div>
      </div>
    </PermissionGuard>
  );
}
