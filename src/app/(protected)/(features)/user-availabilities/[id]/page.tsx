import Link from 'next/link';
import { ArrowLeft, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';

import { UserAvailabilityDetails } from '../components/user-availability-details';
import { PageHeader } from '@/components/page-header';
import { PageTitle } from '@/components/page-title';
import { PermissionGuard, InlinePermissionGuard } from '@/components/auth/permission-guard';
import { ContextAwareBackButton } from '@/components/context-aware-back-button';

interface UserAvailabilityPageProps {
  params: Promise<{
    id: string;
  }>;
}

export const metadata = {
  title: 'UserAvailability Details',
};

export default async function UserAvailabilityPage({ params }: UserAvailabilityPageProps) {
  const { id: idParam } = await params;
  const id = parseInt(idParam, 10);

  return (
    <PermissionGuard
      requiredPermission="userAvailability:read"
      unauthorizedTitle="Access Denied to User Availability Details"
      unauthorizedDescription="You don't have permission to view this user availability."
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
              <h1 className="text-2xl font-semibold text-gray-900">User Availability Details</h1>
              <p className="text-sm text-gray-600 mt-1">
                View detailed information for this user availability
              </p>
            </div>
          </div>

          <UserAvailabilityDetails id={id} />
        </div>
      </div>
    </PermissionGuard>
  );
}
