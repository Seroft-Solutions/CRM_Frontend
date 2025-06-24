import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

import { PartyForm } from "../../components/party-form";
import { PageHeader } from "@/components/page-header";
import { PageTitle } from "@/components/page-title";
import { PermissionGuard } from "@/components/auth/permission-guard";
import { ContextAwareBackButton } from "@/components/context-aware-back-button";

interface EditPartyPageProps {
  params: Promise<{
    id: string;
  }>;
}

export const metadata = {
  title: "Edit Party",
};

export default async function EditPartyPage({ params }: EditPartyPageProps) {
  const { id: idParam } = await params;
  const id = parseInt(idParam, 10);

  return (
    <PermissionGuard 
      requiredPermission="party:update"
      unauthorizedTitle="Access Denied to Edit Party"
      unauthorizedDescription="You don't have permission to edit party records."
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <PageHeader>
            <ContextAwareBackButton 
              defaultRoute="/parties"
              defaultLabel="Back to Parties"
              entityName="Party"
            />
          </PageHeader>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-8 bg-blue-600 rounded-full"></div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Edit Party</h1>
              <p className="text-sm text-gray-600 mt-1">Update the information for this party</p>
            </div>
          </div>
          
          <PartyForm id={id} />
        </div>
      </div>
    </PermissionGuard>
  );
}
