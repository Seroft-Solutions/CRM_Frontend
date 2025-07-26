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

import { RoleForm } from "../../components/role-form";
import { PageHeader } from "@/components/page-header";
import { PageTitle } from "@/components/page-title";
import { PermissionGuard } from "@/core/auth";
import { ContextAwareBackButton } from "@/components/context-aware-back-button";

interface EditRolePageProps {
  params: Promise<{
    id: string;
  }>;
}

export const metadata = {
  title: "Edit Role",
};

export default async function EditRolePage({ params }: EditRolePageProps) {
  const { id: idParam } = await params;
  const id = parseInt(idParam, 10);

  return (
    <PermissionGuard 
      requiredPermission="role:update"
      unauthorizedTitle="Access Denied to Edit Role"
      unauthorizedDescription="You don't have permission to edit role records."
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <PageHeader>
            <ContextAwareBackButton 
              defaultRoute="/roles"
              defaultLabel="Back to Roles"
              entityName="Role"
            />
          </PageHeader>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-8 bg-blue-600 rounded-full"></div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Edit Role</h1>
              <p className="text-sm text-gray-600 mt-1">Update the information for this role</p>
            </div>
          </div>
          
          <RoleForm id={id} />
        </div>
      </div>
    </PermissionGuard>
  );
}
