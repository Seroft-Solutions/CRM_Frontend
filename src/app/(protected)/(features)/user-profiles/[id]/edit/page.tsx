import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

import { UserProfileForm } from "../../components/user-profile-form";
import { PageHeader } from "@/components/page-header";
import { PageTitle } from "@/components/page-title";
import { PermissionGuard } from "@/components/auth/permission-guard";
import { ContextAwareBackButton } from "@/components/context-aware-back-button";

interface EditUserProfilePageProps {
  params: Promise<{
    id: string;
  }>;
}

export const metadata = {
  title: "Edit UserProfile",
};

export default async function EditUserProfilePage({ params }: EditUserProfilePageProps) {
  const { id: idParam } = await params;
  const id = parseInt(idParam, 10);

  return (
    <PermissionGuard 
      requiredPermission="userProfile:update"
      unauthorizedTitle="Access Denied to Edit User Profile"
      unauthorizedDescription="You don't have permission to edit user profile records."
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
              <h1 className="text-2xl font-semibold text-gray-900">Edit User Profile</h1>
              <p className="text-sm text-gray-600 mt-1">Update the information for this user profile</p>
            </div>
          </div>
          
          <UserProfileForm id={id} />
        </div>
      </div>
    </PermissionGuard>
  );
}
