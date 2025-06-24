import Link from "next/link";
import { ArrowLeft, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";

import { OrganizationDetails } from "../components/organization-details";
import { PageHeader } from "@/components/page-header";
import { PageTitle } from "@/components/page-title";
import { PermissionGuard, InlinePermissionGuard } from "@/components/auth/permission-guard";
import { ContextAwareBackButton } from "@/components/context-aware-back-button";

interface OrganizationPageProps {
  params: Promise<{
    id: string;
  }>;
}

export const metadata = {
  title: "Organization Details",
};

export default async function OrganizationPage({ params }: OrganizationPageProps) {
  const { id: idParam } = await params;
  const id = parseInt(idParam, 10);

  return (
    <PermissionGuard 
      requiredPermission="organization:read"
      unauthorizedTitle="Access Denied to Organization Details"
      unauthorizedDescription="You don't have permission to view this organization."
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <PageHeader>
            <ContextAwareBackButton 
              defaultRoute="/organizations"
              defaultLabel="Back to Organizations"
              entityName="Organization"
            />
          </PageHeader>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-8 bg-blue-600 rounded-full"></div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Organization Details</h1>
              <p className="text-sm text-gray-600 mt-1">View detailed information for this organization</p>
            </div>
          </div>
          
          <OrganizationDetails id={id} />
        </div>
      </div>
    </PermissionGuard>
  );
}
