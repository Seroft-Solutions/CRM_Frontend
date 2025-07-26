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

import { UserDraftForm } from "../components/user-draft-form";
import { PageHeader } from "@/components/page-header";
import { PageTitle } from "@/components/page-title";
import { PermissionGuard } from "@/core/auth";
import { ContextAwareBackButton } from "@/components/context-aware-back-button";

export const metadata = {
  title: "Create UserDraft",
};

export default function CreateUserDraftPage() {
  return (
    <PermissionGuard 
      requiredPermission="userDraft:create"
      unauthorizedTitle="Access Denied to Create User Draft"
      unauthorizedDescription="You don't have permission to create new user draft records."
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
              <h1 className="text-2xl font-semibold text-gray-900">Create User Draft</h1>
              <p className="text-sm text-gray-600 mt-1">Enter the details below to create a new user draft</p>
            </div>
          </div>
          
          <UserDraftForm />
        </div>
      </div>
    </PermissionGuard>
  );
}
