import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

import { UserAvailabilityForm } from "../components/user-availability-form";
import { PageHeader } from "@/components/page-header";
import { PageTitle } from "@/components/page-title";
import { PermissionGuard } from "@/components/auth/permission-guard";
import { ContextAwareBackButton } from "@/components/context-aware-back-button";

export const metadata = {
  title: "Create UserAvailability",
};

export default function CreateUserAvailabilityPage() {
  return (
    <PermissionGuard 
      requiredPermission="userAvailability:create"
      unauthorizedTitle="Access Denied to Create User Availability"
      unauthorizedDescription="You don't have permission to create new user availability records."
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
              <h1 className="text-2xl font-semibold text-gray-900">Create User Availability</h1>
              <p className="text-sm text-gray-600 mt-1">Enter the details below to create a new user availability</p>
            </div>
          </div>
          
          <UserAvailabilityForm />
        </div>
      </div>
    </PermissionGuard>
  );
}
