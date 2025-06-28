import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

import { SubCallTypeForm } from "../../components/sub-call-type-form";
import { PageHeader } from "@/components/page-header";
import { PageTitle } from "@/components/page-title";
import { PermissionGuard } from '@/core/auth';
import { ContextAwareBackButton } from "@/components/context-aware-back-button";

interface EditSubCallTypePageProps {
  params: Promise<{
    id: string;
  }>;
}

export const metadata = {
  title: "Edit SubCallType",
};

export default async function EditSubCallTypePage({ params }: EditSubCallTypePageProps) {
  const { id: idParam } = await params;
  const id = parseInt(idParam, 10);

  return (
    <PermissionGuard 
      requiredPermission="subCallType:update"
      unauthorizedTitle="Access Denied to Edit Sub Call Type"
      unauthorizedDescription="You don't have permission to edit sub call type records."
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <PageHeader>
            <ContextAwareBackButton 
              defaultRoute="/sub-call-types"
              defaultLabel="Back to Sub Call Types"
              entityName="SubCallType"
            />
          </PageHeader>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-8 bg-blue-600 rounded-full"></div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Edit Sub Call Type</h1>
              <p className="text-sm text-gray-600 mt-1">Update the information for this sub call type</p>
            </div>
          </div>
          
          <SubCallTypeForm id={id} />
        </div>
      </div>
    </PermissionGuard>
  );
}
