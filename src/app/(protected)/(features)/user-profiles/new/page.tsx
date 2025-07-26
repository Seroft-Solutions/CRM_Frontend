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

import { UserProfileForm } from "../components/user-profile-form";
import { PageHeader } from "@/components/page-header";
import { PageTitle } from "@/components/page-title";
import { PermissionGuard } from "@/core/auth";
import { ContextAwareBackButton } from "@/components/context-aware-back-button";

export const metadata = {
  title: "Create UserProfile",
};

export default function CreateUserProfilePage() {
  return (
    <PermissionGuard 
      requiredPermission="userProfile:create"
      unauthorizedTitle="Access Denied to Create User Profile"
      unauthorizedDescription="You don't have permission to create new user profile records."
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <PageHeader>
            <ContextAwareBackButton 
              defaultRoute="/user-profiles"
              defaultLabel="Back to User Profiles"
              entityName="UserProfile"
            />
          </PageHeader>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-8 bg-blue-600 rounded-full"></div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Create User Profile</h1>
              <p className="text-sm text-gray-600 mt-1">Enter the details below to create a new user profile</p>
            </div>
          </div>
          
          <UserProfileForm />
        </div>
      </div>
    </PermissionGuard>
  );
}
