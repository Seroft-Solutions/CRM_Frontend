import Link from 'next/link';
import { ArrowLeft, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';

import { UserProfileDetails } from '../components/user-profile-details';
import { PageHeader } from '@/components/page-header';
import { PageTitle } from '@/components/page-title';
import { PermissionGuard, InlinePermissionGuard } from '@/components/auth/permission-guard';
import { ContextAwareBackButton } from '@/components/context-aware-back-button';

interface UserProfilePageProps {
  params: Promise<{
    id: string;
  }>;
}

export const metadata = {
  title: 'UserProfile Details',
};

export default async function UserProfilePage({ params }: UserProfilePageProps) {
  const { id: idParam } = await params;
  const id = parseInt(idParam, 10);

  return (
    <PermissionGuard
      requiredPermission="userProfile:read"
      unauthorizedTitle="Access Denied to User Profile Details"
      unauthorizedDescription="You don't have permission to view this user profile."
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
              <h1 className="text-2xl font-semibold text-gray-900">User Profile Details</h1>
              <p className="text-sm text-gray-600 mt-1">
                View detailed information for this user profile
              </p>
            </div>
          </div>

          <UserProfileDetails id={id} />
        </div>
      </div>
    </PermissionGuard>
  );
}
