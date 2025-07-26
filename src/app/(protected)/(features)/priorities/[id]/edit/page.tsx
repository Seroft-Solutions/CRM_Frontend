// ===============================================================
// 🛑 AUTO-GENERATED FILE – DO NOT EDIT DIRECTLY 🛑
// - Source: code generation pipeline
// - To customize: use ./overrides/[filename].ts or feature-level
//   extensions (e.g., ./src/features/.../extensions/)
// - Direct edits will be overwritten on regeneration
// ===============================================================
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

import { PriorityForm } from "../../components/priority-form";
import { PageHeader } from "@/components/page-header";
import { PageTitle } from "@/components/page-title";
import { PermissionGuard } from "@/core/auth";
import { ContextAwareBackButton } from "@/components/context-aware-back-button";

interface EditPriorityPageProps {
  params: Promise<{
    id: string;
  }>;
}

export const metadata = {
  title: "Edit Priority",
};

export default async function EditPriorityPage({ params }: EditPriorityPageProps) {
  const { id: idParam } = await params;
  const id = parseInt(idParam, 10);

  return (
    <PermissionGuard 
      requiredPermission="priority:update"
      unauthorizedTitle="Access Denied to Edit Priority"
      unauthorizedDescription="You don't have permission to edit priority records."
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <PageHeader>
            <ContextAwareBackButton 
              defaultRoute="/priorities"
              defaultLabel="Back to Priorities"
              entityName="Priority"
            />
          </PageHeader>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-8 bg-blue-600 rounded-full"></div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Edit Priority</h1>
              <p className="text-sm text-gray-600 mt-1">Update the information for this priority</p>
            </div>
          </div>
          
          <PriorityForm id={id} />
        </div>
      </div>
    </PermissionGuard>
  );
}
