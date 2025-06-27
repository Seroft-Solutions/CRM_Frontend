import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

import { UserAvailabilityForm } from "../../components/user-availability-form";
import { PageHeader } from "@/components/page-header";
import { PageTitle } from "@/components/page-title";
import { PermissionGuard } from "@/core/auth";
import { ContextAwareBackButton } from "@/components/context-aware-back-button";

interface EditUserAvailabilityPageProps {
  params: Promise<{
    id: string;
  }>;
}

export const metadata = {
  title: "Edit UserAvailability",
};

export default async function EditUserAvailabilityPage({ params }: EditUserAvailabilityPageProps) {
  const { id: idParam } = await params;
  const id = parseInt(idParam, 10);

  return (
    <PermissionGuard 
      requiredPermission="userAvailability:update"
      unauthorizedTitle="Access Denied to Edit User Availability"
      unauthorizedDescription="You don't have permission to edit user availability records."
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <PageHeader>
            <ContextAwareBackButton 
              defaultRoute="/user-availabilities"
              defaultLabel="Back to User Availabilities"
              entityName="UserAvailability"
            />
          </PageHeader>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-8 bg-blue-600 rounded-full"></div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Edit User Availability</h1>
              <p className="text-sm text-gray-600 mt-1">Update the information for this user availability</p>
            </div>
          </div>
          
          <UserAvailabilityForm id={id} />
        </div>
      </div>
    </PermissionGuard>
  );
}
