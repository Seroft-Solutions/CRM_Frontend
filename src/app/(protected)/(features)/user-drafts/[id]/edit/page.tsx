import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

import { UserDraftForm } from "@/app/(protected)/(features)/user-drafts/components/user-draft-form";
import { PageHeader } from "@/components/page-header";
import { PageTitle } from "@/components/page-title";
import { PermissionGuard } from "@/core/auth";
import { ContextAwareBackButton } from "@/components/context-aware-back-button";

interface EditUserDraftPageProps {
  params: Promise<{
    id: string;
  }>;
}

export const metadata = {
  title: "Edit UserDraft",
};

export default async function EditUserDraftPage({ params }: EditUserDraftPageProps) {
  const { id: idParam } = await params;
  const id = parseInt(idParam, 10);

  return (
    <PermissionGuard 
      requiredPermission="userDraft:update"
      unauthorizedTitle="Access Denied to Edit User Draft"
      unauthorizedDescription="You don't have permission to edit user draft records."
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <PageHeader>
            <ContextAwareBackButton 
              defaultRoute="/user-drafts"
              defaultLabel="Back to User Drafts"
              entityName="UserDraft"
            />
          </PageHeader>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-8 bg-blue-600 rounded-full"></div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Edit User Draft</h1>
              <p className="text-sm text-gray-600 mt-1">Update the information for this user draft</p>
            </div>
          </div>
          
          <UserDraftForm id={id} />
        </div>
      </div>
    </PermissionGuard>
  );
}
