import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

import { ChannelTypeForm } from "../components/channel-type-form";
import { PageHeader } from "@/components/page-header";
import { PageTitle } from "@/components/page-title";
import { PermissionGuard } from "@/core/auth";
import { ContextAwareBackButton } from "@/components/context-aware-back-button";

export const metadata = {
  title: "Create ChannelType",
};

export default function CreateChannelTypePage() {
  return (
    <PermissionGuard 
      requiredPermission="channelType:create"
      unauthorizedTitle="Access Denied to Create Channel Type"
      unauthorizedDescription="You don't have permission to create new channel type records."
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
              <h1 className="text-2xl font-semibold text-gray-900">Create Channel Type</h1>
              <p className="text-sm text-gray-600 mt-1">Enter the details below to create a new channel type</p>
            </div>
          </div>
          
          <ChannelTypeForm />
        </div>
      </div>
    </PermissionGuard>
  );
}
