import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

import { ChannelTypeForm } from "@/app/(protected)/(features)/channel-types/components/channel-type-form";
import { PageHeader } from "@/components/page-header";
import { PageTitle } from "@/components/page-title";
import { PermissionGuard } from "@/core/auth";
import { ContextAwareBackButton } from "@/components/context-aware-back-button";

interface EditChannelTypePageProps {
  params: Promise<{
    id: string;
  }>;
}

export const metadata = {
  title: "Edit ChannelType",
};

export default async function EditChannelTypePage({ params }: EditChannelTypePageProps) {
  const { id: idParam } = await params;
  const id = parseInt(idParam, 10);

  return (
    <PermissionGuard 
      requiredPermission="channelType:update"
      unauthorizedTitle="Access Denied to Edit Channel Type"
      unauthorizedDescription="You don't have permission to edit channel type records."
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <PageHeader>
            <ContextAwareBackButton 
              defaultRoute="/channel-types"
              defaultLabel="Back to Channel Types"
              entityName="ChannelType"
            />
          </PageHeader>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-8 bg-blue-600 rounded-full"></div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Edit Channel Type</h1>
              <p className="text-sm text-gray-600 mt-1">Update the information for this channel type</p>
            </div>
          </div>
          
          <ChannelTypeForm id={id} />
        </div>
      </div>
    </PermissionGuard>
  );
}
